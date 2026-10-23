import {D2} from "../../utils/d2";
import {formatNumber} from "../../utils/numbers";
import {GamemodeToName} from "../../utils/osu/gamemode";
import {categorize, MODE_ORDER} from "./FavouriteMedalPicker";

const SORTS = [
    {"Name": "Category", "Key": "category"},
    {"Name": "Most common first", "Key": "common"},
    {"Name": "Rarest first", "Key": "rare"},
    {"Name": "Newest first", "Key": "newest"},
];

// section hues, carried over from eclipse
const GROUP_HUES = {
    "Hush-Hush": 254.7,
    "Hush-Hush (Expert)": 355,
    "Skill & Dedication": 46.1,
    "Mod Introduction": 237.4,
    "Beatmap Spotlights": 211.7,
    "Beatmap Challenge Packs": 352.7,
    "Beatmap Packs": 327,
};

// light reds wash out to salmon, these get their own saturation / lightness
const GROUP_COLOUR_OVERRIDES = {
    "Hush-Hush (Expert)": "hsl(355, 85%, 60%)",
};

export default class MedalsUnachieved {
    main;
    constructor(main) {
        this.main = main;
        this.init()
    }

    el = null;
    sort = "category";

    init() {
        this.el = D2.Div("medals-unachieved-list", () => {
        });
        document.getElementById("medals-unachieved-outer").appendChild(this.el);

        document.getElementById("unachieved-sort").create(SORTS, "Name", 0, "", (item) => {
            this.sort = item.Key;
            this.render();
        });

        this.render();
    }

    // play count / hit count medals ("5,000 Plays", "30,000 Drum Hits", ...)
    milestoneOf(medal) {
        if (!/plays|hits|fruits|keys/i.test(medal.Name)) return null;
        let match = medal.Name.match(/[\d,]+/);
        if (!match) return null;
        let amount = Number(match[0].replace(/,/g, ""));
        if (amount < 1000) return null;
        return amount;
    }

    // osu counts plays, everything else counts hits
    milestoneProgress(mode) {
        let key = mode;
        if (key == "catch") key = "fruits";
        let stats = this.main.profile.User.statistics_rulesets?.[key];
        if (!stats) return null;
        if (mode == "osu") return stats.play_count;
        return stats.total_hits;
    }

    // the next play/hit medal for a mode, with the one before it
    nextMilestone(mode) {
        let medals = this.main.profile.Medals.filter(m => {
            let medalMode = m.Gamemode == "fruits" ? "catch" : m.Gamemode;
            return medalMode == mode && this.milestoneOf(m) !== null;
        });
        medals.sort((a, b) => this.milestoneOf(a) - this.milestoneOf(b));

        let index = medals.findIndex(m => !m.Obtained);
        if (index == -1) return null;

        return {
            "Medal": medals[index],
            "Target": this.milestoneOf(medals[index]),
            "Previous": index > 0 ? medals[index - 1] : null
        };
    }

    renderMilestone(mode) {
        let next = this.nextMilestone(mode);
        if (next === null) return;

        let current = this.milestoneProgress(mode);
        if (current === null) return;

        let progress = Math.min(1, current / next.Target);

        let row = D2.DivLink("/medals/" + next.Medal.Medal_ID, "medals-unachieved-milestone", () => {
            D2.MedalIcon(next.Medal.Link, false, true);
            D2.Div("medals-unachieved-milestone-main", () => {
                D2.Div("medals-unachieved-milestone-top", () => {
                    if (next.Previous !== null) {
                        D2.StyledText("h3", `<span>${next.Previous.Name} →</span> ${next.Medal.Name}`);
                    } else {
                        D2.Text("h3", next.Medal.Name);
                    }
                    D2.StyledText("p", `<strong>${Math.floor(progress * 1000) / 10}%</strong> ${formatNumber(current)} / ${formatNumber(next.Target)}`);
                });
                D2.Div("medals-unachieved-progress", () => {
                    D2.CustomPlus("div", "medals-unachieved-progress-inner", {"style": `width: ${progress * 100}%`}, () => {
                    });
                });
            });
        });
        row.setAttribute("tooltip", this.medalTooltip(next.Medal));
    }

    missing() {
        return this.main.profile.Medals.filter(m => !m.Obtained);
    }

    percent(medal) {
        return Math.round(medal.Frequency * 100 * 100) / 100;
    }

    medalTooltip(medal) {
        return medal.Name + " · " + this.percent(medal) + "% of users have this";
    }

    render() {
        this.el.innerHTML = "";

        if (this.missing().length == 0) {
            this.el.appendChild(D2.Div("medals-unachieved-done", () => {
                D2.LucideIcon("party-popper");
                D2.Text("h3", "Every medal obtained!");
            }));
            return;
        }

        if (this.sort == "category") {
            this.renderCategories();
        } else {
            this.renderSorted();
        }
    }

    renderCategories() {
        let groups = categorize(this.main.profile.Medals, (medal) => !medal.Obtained);

        for (let groupName in groups) {
            let group = groups[groupName];
            if (Object.keys(group).length == 0) continue;

            let all = this.main.profile.Medals.filter(m => m.Grouping == groupName);
            let has = all.filter(m => m.Obtained).length;

            let section = D2.Div("medals-unachieved-section", () => {
                // coloured strip on top like eclipse, name / bar / count in one line
                D2.Div("medals-unachieved-section-header", () => {
                    D2.Text("h2", groupName);
                    D2.Div("medals-unachieved-progress", () => {
                        D2.CustomPlus("div", "medals-unachieved-progress-inner", {"style": `width: ${has / all.length * 100}%`}, () => {
                        });
                    });
                    D2.StyledText("p", `<strong>${has}</strong>/${all.length}`);
                });

                D2.Div("medals-unachieved-section-inner", () => {
                    let multipleModes = Object.keys(group).length > 1;
                    for (let mode of MODE_ORDER) {
                        if (!group[mode]) continue;

                        D2.Div("medals-unachieved-mode", () => {
                            if (multipleModes) {
                                D2.Div("medals-unachieved-mode-header", () => {
                                    D2.Custom("i", "icon-gamemode-" + mode);
                                    D2.Text("p", GamemodeToName(mode));
                                });
                            }
                            if (groupName == "Skill & Dedication" && mode != "all") {
                                this.renderMilestone(mode);
                            }

                            D2.Div("medals-unachieved-grid", () => {
                                for (let medal of group[mode]) {
                                    let link = D2.DivLink("/medals/" + medal.Medal_ID, "medals-unachieved-medal", () => {
                                        D2.MedalIcon(medal.Link, false, true);
                                    });
                                    link.setAttribute("tooltip", this.medalTooltip(medal));
                                }
                            });
                        });
                    }
                });
            });

            // only accents use the group colour, the rest stays on the normal palette
            if (GROUP_COLOUR_OVERRIDES[groupName] !== undefined) {
                section.style.setProperty("--group-col", GROUP_COLOUR_OVERRIDES[groupName]);
            } else if (GROUP_HUES[groupName] !== undefined) {
                section.style.setProperty("--group-col", "hsl(" + GROUP_HUES[groupName] + ", 65%, 68%)");
            }
            this.el.appendChild(section);
        }
    }

    // flat list with the numbers that help pick what to go for next
    renderSorted() {
        let medals = [...this.missing()];

        if (this.sort == "common") medals.sort((a, b) => b.Frequency - a.Frequency);
        if (this.sort == "rare") medals.sort((a, b) => a.Frequency - b.Frequency);
        if (this.sort == "newest") medals.sort((a, b) => new Date(b.Date_Released) - new Date(a.Date_Released));

        for (let medal of medals) {
            let mode = medal.Gamemode ?? "all";
            if (mode == "fruits") mode = "catch";

            let row = D2.DivLink("/medals/" + medal.Medal_ID, "medals-unachieved-row", () => {
                D2.MedalIcon(medal.Link, false, true);
                D2.Div("medals-unachieved-row-text", () => {
                    D2.Text("h3", medal.Name);
                    D2.StyledText("p", `<i class="icon-gamemode-${mode}"></i> ${medal.Grouping}`);
                });
                D2.Div("medals-unachieved-row-stat", () => {
                    if (this.sort == "newest") {
                        if (medal.Date_Released) {
                            D2.Text("h3", D2.TimeRelative(new Date(medal.Date_Released)));
                            D2.Text("p", "released");
                        } else {
                            D2.Text("h3", "Unknown");
                            D2.Text("p", "release date");
                        }
                    } else {
                        D2.Text("h3", this.percent(medal) + "%");
                        D2.Text("p", formatNumber(medal.Count_Achieved_By) + " users");
                    }
                });
            });
            this.el.appendChild(row);
        }
    }
}
