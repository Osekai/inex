import "../../css/views/profiles.css";
import "../../css/views/profiles/goals.css";
import "../../css/views/profiles/timeline.css";
import "../../css/views/profiles/medals.css";
import "../../css/views/profiles/history.css";
import "../../css/views/profiles/unachieved.css";
import "../../css/views/profiles/info.css";
import "../../css/views/profiles/banners.css";
import {Graph} from "../ui/graph";
import {Clubs} from "../utils/clubs";
import MedalBatchData from "../data/MedalBatchData";
import {DoRequest} from "../utils/requests";
import {PushToast} from "../ui/toasts";
import EmblaCarousel from "embla-carousel";
import {ContentError} from "../ui/error";
import {D2} from "../utils/d2";
import {Clubs2} from "../utils/Clubs2";
import {UTCify} from "../utils/time";
import {Overlay} from "../ui/overlay";
import {setSections} from "../utils/urlQuery";
import Banners from "./profiles/Banners";
import Goals from "./profiles/Goals";
import Timeline from "./profiles/Timeline";
import MedalHistory from "./profiles/MedalHistory";
import MedalsUnachieved from "./profiles/MedalsUnachieved";
import {OpenFavouriteMedalPicker} from "./profiles/FavouriteMedalPicker";
import {formatNumber} from "../utils/numbers";


class Profiles {

    profile = null;
    gamemode = null;
    constructor() {
        // holds the parsed api response once Load() succeeds
        this.profile = null;
        this.Load();
    }

    Am_User() {
        if (!loggedIn) return false;
        return userData.id == this.profile.User.id;
    }

    static El(sel, cb) {
        for (let el of document.querySelectorAll(sel)) {
            cb(el);
        }
    }

    async Load() {
        let currentGamemode = gamemode;
        let response = profileResponse;
        console.log(response);
        if (response == null || response.success == false || typeof (response.content) == "undefined") {
            console.error(response.message);
            new ContentError("This user does not exist", "Please make sure the URL is correct", null, null, [
                {
                    "text": "Profiles Home",
                    "href": "/profiles"
                }
            ]);
            return;
        }
        if(currentGamemode == "") {
            currentGamemode = response.content.User.playmode;
        }
        //renderDebugTimings(response.timings);
        this.profile = response.content;
        document.getElementById("json-test").innerHTML = JSON.stringify(this.profile.Statistics, null, 2);

        // update url to match gamemode
        if(gamemode == "")
        setSections("/profiles/{profile}/{gamemode}", {
            "profile": profileID,
            "gamemode": currentGamemode
        }, false)

        this.gamemode = currentGamemode;

        this.Render_Header();
        this.Render_PanelAllMode();
        this.Render_PanelMedals();
        this.Tab_Medals();
        this.Render_MedalGraph();

        document.getElementById("comments").loadComments(this.profile.User.id);

        this.banners = new Banners(this);
        this.goals = new Goals(this);
        this.timeline = new Timeline(this);
        this.medalHistory = new MedalHistory(this);
        this.medalsUnachieved = new MedalsUnachieved(this);

        // counts towards most viewed, the backend skips your own profile and quick refreshes
        if (loggedIn && !this.Am_User()) {
            DoRequest("POST", "/api/profiles/visits/" + this.profile.User.id + "/record");
        }

        document.getElementById("profiles-loader").classList.add("hidden");
        document.getElementById("profile-outer").classList.remove("hidden");
    }

    Render_Header() {
        let profile = this.profile;

        document.getElementById("profiles-header-img").appendChild(D2.Image("", profile.User.cover_url))
        document.getElementById("profiles-header-img").appendChild(D2.Image("blurred", profile.User.cover_url))
        
        Profiles.El("[pr-el=pfp]", (el) => {
            el.src = profile.User.avatar_url;
        })
        // the profile is fetched per mode, so switching just opens the other url
        Profiles.El("[pr-el=gamemode-selector]", (el) => {
            el.value = this.gamemode;
            el.addEventListener("change", (e) => {
                let current = this.gamemode;
                if (current == "fruits") current = "catch";
                if (e.detail == current) return;

                window.location.href = "/profiles/" + profileID + "/" + e.detail + window.location.search + window.location.hash;
            });
        });
        Profiles.El("[pr-el=link-osu]", (el) => {
            // osu web calls catch fruits
            let osuMode = this.gamemode;
            if (osuMode == "catch") osuMode = "fruits";
            el.href = "https://osu.ppy.sh/users/" + profile.User.id + "/" + osuMode;
        });
        Profiles.El("[pr-el=username]", (el) => {
            el.innerText = profile.User.username;
        });
        Profiles.El("[pr-el=flag]", (el) => {
            if (!profile.User.country) {
                el.classList.add("hidden");
                return;
            }
            el.src = "/assets/flags/4x3/" + profile.User.country.code.toLowerCase() + ".svg";
        });
        Profiles.El("[pr-el=country]", (el) => {
            if (!profile.User.country) {
                el.innerText = "Unknown country";
                return;
            }
            el.innerText = profile.User.country.name;
        });
        Profiles.El("[pr-el=gamemode-icon]", (el) => {
            // the icon font calls fruits catch
            let iconMode = this.gamemode;
            if (iconMode == "fruits") iconMode = "catch";
            el.className = "icon-gamemode-" + iconMode;
        });
        Profiles.El("[pr-el=gamemode-rank]", (el) => {
            if (!profile.User.statistics || !profile.User.statistics.global_rank) {
                el.innerText = "Unranked";
                return;
            }
            el.innerText = formatNumber(profile.User.statistics.global_rank);
        });

        Profiles.El("[pr-el=osekai-statistics-global-comments]", (el) => {
            el.innerText = formatNumber(profile.Osekai?.Statistics?.Global?.Comments ?? 0);
        })
        Profiles.El("[pr-el=osekai-statistics-medals-beatmaps]", (el) => {
            el.innerText = formatNumber(profile.Osekai?.Statistics?.Medals?.Beatmaps ?? 0);
        })
        Profiles.El("[pr-el=osekai-statistics-medals-votes]", (el) => {
            el.innerText = formatNumber(profile.Osekai?.Statistics?.Medals?.Votes ?? 0);
        })
        Profiles.El("[pr-el=osekai-statistics-joined-osu]", (el) => {
            if (!profile.User.join_date) {
                el.innerText = "Unknown";
                return;
            }
            el.innerText = D2.TimeRelative(UTCify(profile.User.join_date));
        })
        Profiles.El("[pr-el=osekai-statistics-joined-osekai]", (el) => {
            if (!profile.Osekai || !profile.Osekai.Joined) {
                el.innerText = "Not an Osekai member";
                return;
            }
            el.innerText = D2.TimeRelative(UTCify(profile.Osekai.Joined));
        })
    }

    Render_PanelAllMode() {
        let profile = this.profile;

        Profiles.El("[pr-el=panel-allmode]", (el) => {
            // we don't have this data yet
            let outer = D2.Div("panel-stats panel-allmode-outer", () => {
                D2.Div("toolbar-area", () => {
                    D2.Text("p", "All-Mode");
                    D2.Div("", () => {
                        D2.CustomPlus("button", "", {"otab-button": "stdev"}, () => {
                            D2.Text("p", "Stdev")
                        })
                        D2.CustomPlus("button", "", {"otab-button": "total"}, () => {
                            D2.Text("p", "Total")
                        })
                    })
                })
                let stats = profile.Statistics.AllMode;
                D2.Div("cunt", () => {
                    D2.CustomPlus("div", "mainarea", {"otab-name": "stdev"}, () => {
                        D2.StyledText("h1", `<strong>#${stats.Stdev.Global}</strong> Global`);
                        let country = D2.StyledText("h3", `<strong>#${stats.Stdev.Country}</strong> Country`);
                        country.prepend(D2.Image("flag", "/assets/flags/4x3/" + profile.User.country.code.toLowerCase() + ".svg"))
                        D2.Div("footerarea", () => {
                            D2.StyledText("p", `<strong>${stats.Stdev.PP}</strong>spp`);
                            D2.StyledText("p", `<strong>${stats.Stdev.Accuracy}%</strong> acc`);
                        })
                    })
                    D2.CustomPlus("div", "mainarea", {"otab-name": "total"}, () => {
                        D2.StyledText("h1", `<strong>#${formatNumber(stats.Total.Global)}</strong> Global`);
                        let country = D2.StyledText("h3", `<strong>#${formatNumber(stats.Total.Country)}</strong> Country`);
                        country.prepend(D2.Image("flag", "/assets/flags/4x3/" + profile.User.country.code.toLowerCase() + ".svg"))
                        D2.Div("footerarea", () => {
                            D2.StyledText("p", `<strong>${formatNumber(stats.Total.PP, 2)}</strong>pp`);
                            D2.StyledText("p", `<strong>${formatNumber(stats.Total.Accuracy, 2)}%</strong> acc`);
                        })
                    })
                })
            });
            el.innerHTML = "";
            el.appendChild(outer);

            outer.setAttribute("otab-container", "allmode-switcher")
            outer.setAttribute("otab-default", "stdev")
            outer.setAttribute("otab-no-history", "lol")
        });
    }

    // shared between Render_PanelMedals and Tab_Medals, so it lives on the class
    MedalProgressBar() {
        let profile = this.profile;
        let el = D2.Div("club-progress-bar", () => {
            let progress = profile.Statistics.Medals.TotalAchieved / profile.Statistics.Medals.TotalReleased;
            D2.CustomPlus("div", "progress-bar-inner", {"style": `width: ${progress * 100}%`}, () => {
            })
        })
        el.classList.add(profile.Statistics.Medals.Quick["Club"].cssClass);
        return el;
    }

    Render_PanelMedals() {
        let profile = this.profile;

        /// === medals ===
        profile.Statistics.Medals.Quick = {
            "Percentage": Math.round(profile.User.user_achievements.length / profile.Medals.length * 10000) / 100,
        }
        profile.Statistics.Medals.Quick["Club"] = Clubs2.Get(profile.Statistics.Medals.Quick["Percentage"]); // done out of scope so we can reference the percentage

        Profiles.El("[pr-el=panel-medals]", (el) => {
            let stats = profile.Statistics.Medals;
            let outer = D2.Div("panel-stats panel-medals-outer " + stats.Quick.Club.cssClass, () => {
                D2.Image("rank-image", "/public/img/clubs/" + stats.Quick.Club.rank + ".png", "medal")
                D2.Text("p", "Medals");
                D2.StyledText("h1", `<strong>${stats.Quick.Club.rank}% Club</strong>`);
                // we don't have this data yet
                D2.StyledText("h2", `<strong>#${formatNumber(stats.Ranks.Global)}</strong> Global`)
                let country = D2.StyledText("h3", `<strong>#${formatNumber(stats.Ranks.Country)}</strong> Country`);
                D2.Div("footerarea", () => {
                    D2.StyledText("p", `<strong>${formatNumber(stats.TotalAchieved)} medals</strong> (${stats.Quick.Percentage}%)`);
                    // TODO: progress bar
                    let currentMedals = profile.User.user_achievements.length;
                    let nextClub = stats.Quick.Club.Next();
                    if (nextClub !== null) {
                        let vx = D2.StyledText("p", formatNumber(nextClub.GetCount(stats.TotalReleased) - stats.TotalAchieved) + " until ", "next-medals");
                        vx.appendChild(D2.Image("rank-image-small", `/public/img/clubs/${nextClub.rank}.png`))
                        vx.setAttribute("tooltip", formatNumber(nextClub.GetCount(stats.TotalReleased) - stats.TotalAchieved) + " medals to go until you get to " + nextClub.rank + "% club!");
                    } else {
                        let vx = D2.Text("p", "At the top.");
                    }
                })

                this.MedalProgressBar()
            });
            el.innerHTML = "";
            el.appendChild(outer);
        });
    }

    Tab_Medals() {
        let profile = this.profile;
        let stats = profile.Statistics.Medals;

   
        Profiles.El("[pr-el=medals-club-badge]", (el) => {
            el.src = `/public/img/clubs/${stats.Quick.Club.rank}.png`;
        })

        Profiles.El("[pr-el=medals-club-class]", (el) => {
            el.classList.add(stats.Quick.Club.cssClass);
        })
 
        Profiles.El("[pr-el=medals-club-name]", (el) => {
            el.innerText = stats.Quick.Club.name;
        })

        Profiles.El("[pr-el=medals-club-next-badge]", (el) => {
            let nextClub = stats.Quick.Club.Next();
            if (nextClub !== null) {
                el.src = `/public/img/clubs/${nextClub.rank}.png`;
            } else {
                el.src = "/public/img/clubs/0.png";
            }
        })

        Profiles.El("[pr-el=medals-club-next-class]", (el) => {
            let nextClub = stats.Quick.Club.Next();
            if (nextClub !== null) {
                el.classList.add(nextClub.cssClass);
            }
        });
        Profiles.El("[pr-el=medals-club-next-name]", (el) => {
            let nextClub = stats.Quick.Club.Next();
            if (nextClub !== null) {
                el.innerText = nextClub.name;
            }
        });
        // nothing left to reach at 100%, so the whole "medals until" bit goes
        Profiles.El("[pr-el=medals-club-next]", (el) => {
            let nextClub = stats.Quick.Club.Next();
            if (nextClub === null) {
                el.style.display = "none";
            } else {
                el.style.display = "";
            }
        });
        Profiles.El("[pr-el=medals-club-next-togo]", (el) => {
            let nextClub = stats.Quick.Club.Next();
            if (nextClub !== null) {
                let currentMedals = profile.User.user_achievements.length;
                let nextMedals = nextClub.GetCount(stats.TotalReleased);
                el.innerText = formatNumber(nextMedals - currentMedals);
            } else {
                el.innerText = "";
            }
        });

        Profiles.El("[pr-el=medals-percentage]", (el) => {
            el.innerText = stats.Quick.Percentage + "%";
        });
        Profiles.El("[pr-el=medals-total-achieved]", (el) => {
            el.innerText = formatNumber(stats.TotalAchieved);
        });
        Profiles.El("[pr-el=medals-total-released]", (el) => {
            el.innerText = formatNumber(stats.TotalReleased);
        });


        Profiles.El("[pr-el=medals-global-rank]", (el) => {
            el.innerText = "#" + formatNumber(stats.Ranks.Global);
        });
        Profiles.El("[pr-el=medals-country-rank]", (el) => {
            el.innerText = "#" + formatNumber(stats.Ranks.Country);
        });


        Profiles.El("[pr-el=medals-progressbar]", (el) => {
            el.innerHTML = "";
            el.appendChild(this.MedalProgressBar());
        });

        // 10 rarest the user has, rarest first
        let rarestMedals = profile.Medals
            .filter(medal => medal.Obtained)
            .sort((a, b) => a.Frequency - b.Frequency)
            .slice(0, 10);

        Profiles.El("[pr-el=medals-rarest-list]", (el) => {
            el.innerHTML = "";
            for (let medal of rarestMedals) {
                let item = D2.DivLink("/medals/" + medal.Medal_ID, "medals-rarest-item", () => {
                    D2.MedalIcon(medal.Link);
                    D2.Text("h3", medal.Name);
                    D2.StyledText("p", `<strong>${Math.round(medal.Frequency * 100 * 10000) / 10000}%</strong> of users`);
                    D2.Text("small", formatNumber(medal.Count_Achieved_By) + " users");
                });
                if (medal.Obtained_Date) {
                    item.setAttribute("tooltip", "Achieved " + D2.TimeFull(UTCify(medal.Obtained_Date)));
                }
                el.appendChild(item);
            }

            // drag to scroll, the track is the embla container
            // axis lock so vertical drags scroll the page and horizontal ones stay on the carousel
            el.parentElement.setAttribute("data-axis-lock", "");
            EmblaCarousel(el.parentElement, {
                "dragFree": true,
                "align": "start",
                "containScroll": "trimSnaps"
            });
        });

        this.FavouriteMedal_Set(profile.Favourite_Medal);
    }

    // fills in missing days between data points so the graph doesn't jump gaps
    ForwardFill(data) {
        const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
        const filled = [];

        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const nextTs = new Date(sorted[i + 1].date).getTime();
            let ts = new Date(current.date).getTime();

            while (ts < nextTs) {
                filled.push({
                    ...current,
                    date: new Date(ts).toISOString()
                });
                ts += 86400000;
            }
        }
        filled.push(sorted[sorted.length - 1]);
        return filled;
    }

    Render_MedalGraph() {
        let profile = this.profile;

        let container = document.getElementById('medal-graph');
        const graph = new Graph(container);
        graph.renderTooltip = d => `<small>${d.date}</small><h1>${d.value}%</h1><h3>(${d.achieved}/${d.released} medals)</h3>`;
        graph.defaultColour = '#800000';
        graph.events = [];

        for (let event of MedalBatchData) {
            graph.events.push({
                type: "event",
                title: event.name,
                date: event.date
            })
        }


        let data = profile.Graphs.MedalPercentageOverTime.Relative.map(d => ({
            date: d.Date,
            value: d.Percentage,
            achieved: d.Achieved,
            released: d.Released
        }));

        for (let dataitem of data) {
            graph.events.push({
                type: "colour",
                colour: Clubs.GetClubColour(Clubs.GetClub(dataitem.value)),
                date: dataitem.date
            })
        }
        console.log(data);
        graph.load(data);
    }


    FavouriteMedal_Set(id) {
        let medal = this.profile.Medals.find(m => m.Medal_ID == id);

        Profiles.El("[pr-el=medal-favourite]", (el) => {
            el.innerHTML = "";

            if (!medal) {
                // nothing to show someone else
                if (!this.Am_User()) {
                    el.style.display = "none";
                    return;
                }

                let empty = D2.Div("medal-favourite-empty", () => {
                    D2.LucideIcon("star");
                    D2.Text("h3", "Pick a favourite medal");
                    D2.Text("p", "Show off the one you're proudest of");
                });
                empty.addEventListener("click", () => {
                    this.FavouriteMedal_Change();
                });
                el.appendChild(empty);
                return;
            }

            el.style.display = "";
            // same shape as the rarest box next to it, heading on top then the medal
            let card = D2.DivLink("/medals/" + medal.Medal_ID, "medal-favourite-card", () => {
                D2.StyledText("p", `<i data-lucide="star"></i> Favourite Medal`);
                D2.Div("medal-favourite-body", () => {
                    D2.MedalIcon(medal.Link);
                    D2.Div("medal-favourite-text", () => {
                        D2.Text("h1", medal.Name);
                        D2.StyledText("h4", `<strong>${Math.round(medal.Frequency * 100 * 10000) / 10000}%</strong> of users · ${formatNumber(medal.Count_Achieved_By)} users`);
                        if (medal.Obtained_Date) {
                            D2.Text("h4", "Achieved " + D2.TimeFull(UTCify(medal.Obtained_Date)));
                        }
                    });
                });
            });

            if (this.Am_User()) {
                let edit = D2.IconButton("pencil", "", "medal-favourite-edit");
                edit.setAttribute("tooltip", "Change favourite medal");
                edit.addEventListener("click", (e) => {
                    // it sits inside the medal link
                    e.preventDefault();
                    this.FavouriteMedal_Change();
                });
                card.appendChild(edit);
            }

            el.appendChild(card);
        });
    }

    FavouriteMedal_Change() {
        if (!this.Am_User()) return;

        OpenFavouriteMedalPicker(this.profile, (id) => {
            this.profile.Favourite_Medal = id;
            this.FavouriteMedal_Set(id);
        });
    }
}


new Profiles();