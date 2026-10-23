import {D2} from "../../utils/d2";
import {UTCify} from "../../utils/time";
import MedalBatchData from "../../data/MedalBatchData";

// how many icons a release bar shows before it turns into +N
const STACK_LIMIT = 8;

// release dates in the db can be a day or two off the batch list
const BATCH_MATCH_DAYS = 2;

export default class MedalHistory {
    main;
    constructor(main) {
        this.main = main;
        this.init()
    }

    el = null;

    init() {
        this.el = D2.Div("medal-history", () => {
        });
        document.getElementById("medal-history-outer").appendChild(this.el);
        this.render();
    }

    day(date) {
        return date.substring(0, 10);
    }

    formatDate(date) {
        return new Date(this.day(date) + "T00:00:00").toLocaleDateString(undefined, {
            "day": "numeric",
            "month": "short",
            "year": "numeric"
        });
    }

    // whole days between release and achieving it, null if it doesn't make sense
    daysAfterRelease(medal) {
        if (!medal.Date_Released) return null;
        if (!medal.Obtained_Date) return null;
        let released = new Date(this.day(medal.Date_Released) + "T00:00:00").getTime();
        let achieved = new Date(this.day(medal.Obtained_Date) + "T00:00:00").getTime();
        let days = Math.round((achieved - released) / 86400000);
        if (days < 0) return null;
        return days;
    }

    medalTooltip(medal) {
        let text = medal.Name;
        if (medal.Obtained_Date) {
            text += " · achieved " + D2.TimeFull(UTCify(medal.Obtained_Date));
        }

        // only interesting while it's fairly fresh
        let days = this.daysAfterRelease(medal);
        if (days === 0) text += " (on release day!)";
        if (days === 1) text += " (1 day after release)";
        if (days !== null && days > 1 && days <= 365) text += " (" + days + " days after release)";

        return text;
    }

    // medals released after the user's first one, grouped by release day
    releases(firstDay) {
        let groups = {};
        for (let medal of this.main.profile.Medals) {
            if (!medal.Date_Released) continue;
            let day = this.day(medal.Date_Released);
            if (day <= firstDay) continue;

            if (!groups[day]) groups[day] = [];
            groups[day].push(medal);
        }

        // only real batches get a bar, lone one-off medals just show up in the grid
        let list = [];
        for (let day in groups) {
            let batch = MedalBatchData.find(b => {
                let gap = Math.abs(new Date(b.date) - new Date(day)) / 86400000;
                return gap <= BATCH_MATCH_DAYS;
            });
            if (!batch) continue;

            list.push({
                "Type": "release",
                "Date": day,
                "Names": [batch.name],
                "Medals": groups[day].sort((a, b) => a.Ordering - b.Ordering)
            });
        }
        return list;
    }

    // back to back releases with nothing achieved in between don't tell us anything apart,
    // so squash them into one bar (as long as they're in the same year)
    mergeReleases(events) {
        let merged = [];
        for (let event of events) {
            let last = merged[merged.length - 1];

            let canMerge = false;
            if (last && last.Type == "release" && event.Type == "release") {
                if (last.Date.substring(0, 4) == event.Date.substring(0, 4)) canMerge = true;
            }

            if (!canMerge) {
                merged.push(event);
                continue;
            }

            last.EndDate = event.Date;
            last.Medals = last.Medals.concat(event.Medals);
            for (let name of event.Names) {
                if (!last.Names.includes(name)) last.Names.push(name);
            }
        }
        return merged;
    }

    render() {
        this.el.innerHTML = "";

        let obtained = this.main.profile.Medals
            .filter(m => m.Obtained)
            .sort((a, b) => new Date(a.Obtained_Date) - new Date(b.Obtained_Date));

        if (obtained.length == 0) {
            this.el.appendChild(D2.Text("p", "No medals yet!", "medal-history-empty"));
            return;
        }

        let firstDay = this.day(obtained[0].Obtained_Date);

        // one feed, oldest first so it reads top to bottom
        let events = obtained.map(medal => ({
            "Type": "medal",
            "Date": this.day(medal.Obtained_Date),
            "Medal": medal
        }));
        events = events.concat(this.releases(firstDay));
        events.sort((a, b) => {
            if (a.Date != b.Date) return a.Date < b.Date ? -1 : 1;
            // a release comes before anything got that day
            if (a.Type == b.Type) return 0;
            if (a.Type == "release") return -1;
            return 1;
        });

        events = this.mergeReleases(events);

        let firstYear = Number(firstDay.substring(0, 4));
        let currentYear = new Date().getFullYear();

        for (let year = firstYear; year <= currentYear; year++) {
            let yearEvents = events.filter(e => Number(e.Date.substring(0, 4)) == year);
            this.el.appendChild(this.renderYear(year, yearEvents));
        }
    }

    renderYear(year, events) {
        let medalCount = events.filter(e => e.Type == "medal").length;
        let releaseCount = events.filter(e => e.Type == "release").length;

        // nothing happened for them this year, keep it to one muted line
        if (medalCount == 0) {
            return D2.Div("medal-history-year quiet", () => {
                D2.Div("medal-history-year-header", () => {
                    D2.Text("h2", year);
                    if (releaseCount == 0) {
                        D2.Text("p", "No medals obtained");
                    } else if (releaseCount == 1) {
                        D2.Text("p", "No medals obtained, while 1 new batch came out");
                    } else {
                        D2.Text("p", "No medals obtained, while " + releaseCount + " new batches came out");
                    }
                });
            });
        }

        return D2.Div("medal-history-year", () => {
            D2.Div("medal-history-year-header", () => {
                D2.Text("h2", year);
                D2.StyledText("p", `<strong>${medalCount}</strong> new medal${medalCount == 1 ? "" : "s"}`);
            });

            // achieved medals fill grids, a release splits them
            let grid = null;
            for (let event of events) {
                if (event.Type == "release") {
                    grid = null;
                    this.renderRelease(event);
                    continue;
                }

                if (grid === null) {
                    grid = D2.Div("medal-history-grid", () => {
                    });
                }

                let medal = event.Medal;
                let link = D2.DivLink("/medals/" + medal.Medal_ID, "medal-history-medal", () => {
                    D2.MedalIcon(medal.Link, false, true);
                });
                link.setAttribute("tooltip", this.medalTooltip(medal));
                grid.appendChild(link);
            }
        });
    }

    renderRelease(release) {
        let total = release.Medals.length;
        let got = release.Medals.filter(m => m.Obtained).length;

        let name = release.Names[0];
        if (release.Names.length > 1) {
            name += " + " + (release.Names.length - 1) + " more";
        }

        let bar = D2.Div("medal-history-release", () => {
            // fixed width so the text always starts in the same place
            D2.Text("p", "+" + total, "medal-history-release-count");
            D2.Div("medal-history-release-text", () => {
                let date = this.formatDate(release.Date);
                if (release.EndDate) date += " – " + this.formatDate(release.EndDate);
                D2.StyledText("p", `<strong>${name}</strong> · ${date}`);
            });

            let stack = D2.Div("medal-history-stack", () => {
                for (let medal of release.Medals.slice(0, STACK_LIMIT)) {
                    let icon = D2.Div("medal-history-stack-icon", () => {
                        D2.MedalIcon(medal.Link, false, true);
                    });
                    if (!medal.Obtained) icon.classList.add("missing");
                    icon.setAttribute("tooltip", medal.Name);
                }
                if (total > STACK_LIMIT) {
                    D2.Text("p", "+" + (total - STACK_LIMIT), "medal-history-stack-more");
                }
            });
            // below, so it doesn't cover the medal name tooltips
            stack.setAttribute("tooltip", got + "/" + total + " obtained");
            stack.setAttribute("tooltip-placement", "bottom");
        });

        // merged bars list everything that's in them
        if (release.Names.length > 1) {
            bar.querySelector(".medal-history-release-text").setAttribute("tooltip", release.Names.join(", "));
        }
    }
}
