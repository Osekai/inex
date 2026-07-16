import "../../css/views/profiles.css";
import {Graph} from "../ui/graph";
import {Clubs} from "../utils/clubs";
import MedalBatchData from "../data/MedalBatchData";
import {DoRequest} from "../utils/requests";
import {renderDebugTimings} from "../layout/debug";
import {ContentError} from "../ui/error";
import {D2} from "../utils/d2";
import {Clubs2} from "../utils/Clubs2";


async function Load() {
    let profiles = await DoRequest("POST", "/api/profiles/" + profileID)
    console.log(profiles);
    if(profiles == null || profiles.success == false || typeof(profiles.content) == "undefined") {
        console.error(profiles.message);
        new ContentError("This user does not exist", "Please make sure the URL is correct", null, null, [
            {
                "text": "Profiles Home",
                "href": "/profiles"
            }
        ]);
        return;
    }
    //renderDebugTimings(profiles.timings);
    profiles = profiles.content;
    document.getElementById("json-test").innerHTML = JSON.stringify(profiles.Statistics, null, 2);

    document.getElementById("profiles-header-img").appendChild(D2.Image("", profiles.User.cover_url))
    document.getElementById("profiles-header-img").appendChild(D2.Image("blurred", profiles.User.cover_url))

    for(let el of document.querySelectorAll("[pr-el=pfp]")) {
        el.src = profiles.User.avatar_url;
    }
    for(let el of document.querySelectorAll("[pr-el=link-osu]")) {
        el.href = "https://osu.ppy.sh/users/" + profiles.User.id;
    }
    for(let el of document.querySelectorAll("[pr-el=username]")) {
        el.innerText = profiles.User.username;
    }
    for(let el of document.querySelectorAll("[pr-el=flag]")) {
        el.src = "/assets/flags/4x3/" + profiles.User.country.code.toLowerCase() + ".svg";
    }
    for(let el of document.querySelectorAll("[pr-el=country]")) {
        el.innerText = profiles.User.country.name;
    }

    for(let el of document.querySelectorAll("[pr-el=gamemode-icon]")) {
        el.className = "icon-gamemode-" + profiles.User.playmode;
    }
    for(let el of document.querySelectorAll("[pr-el=gamemode-rank]")) {
        el.innerText = profiles.User.statistics.global_rank;
    }

    for(let el of document.querySelectorAll("[pr-el=panel-allmode]")) {
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
            let stats = profiles.Statistics.AllMode;
            D2.Div("cunt", () => {
                D2.CustomPlus("div", "mainarea", {"otab-name": "stdev"}, () => {
                    D2.StyledText("h1", `<strong>#${stats.Stdev.Global}</strong> Global`);
                    let country = D2.StyledText("h3", `<strong>#${stats.Stdev.Country}</strong> Country`);
                    country.prepend(D2.Image("flag", "/assets/flags/4x3/" + profiles.User.country.code.toLowerCase() + ".svg"))
                    D2.Div("footerarea", () => {
                        D2.StyledText("p", `<strong>${stats.Stdev.PP}</strong>spp`);
                        D2.StyledText("p", `<strong>${stats.Stdev.Accuracy}%</strong> acc`);
                    })
                })
                D2.CustomPlus("div", "mainarea", {"otab-name": "total"}, () => {
                    D2.StyledText("h1", `<strong>#${stats.Total.Global}</strong> Global`);
                    let country = D2.StyledText("h3", `<strong>#${stats.Total.Country}</strong> Country`);
                    country.prepend(D2.Image("flag", "/assets/flags/4x3/" + profiles.User.country.code.toLowerCase() + ".svg"))
                    D2.Div("footerarea", () => {
                        D2.StyledText("p", `<strong>${stats.Total.PP}</strong>pp`);
                        D2.StyledText("p", `<strong>${stats.Total.Accuracy}%</strong> acc`);
                    })
                })
            })
        });
        el.innerHTML = "";
        el.appendChild(outer);

        outer.setAttribute("otab-container", "allmode-switcher")
        outer.setAttribute("otab-default", "stdev")
        outer.setAttribute("otab-no-history", "lol")
    }


    /// === medals ===

    profiles.Statistics.Medals.Quick = {
        "Percentage": Math.round(profiles.User.user_achievements.length / profiles.Medals.length * 10000)/100,
    }
    profiles.Statistics.Medals.Quick["Club"] = Clubs2.Get(profiles.Statistics.Medals.Quick["Percentage"]); // done out of scope so we can reference the percentage

    let medalProgressBar = () => {
        let el = D2.Div("club-progress-bar", () => {
            let progress =  profiles.Statistics.Medals.TotalAchieved / profiles.Statistics.Medals.TotalReleased;
            D2.CustomPlus("div", "progress-bar-inner", {"style": `width: ${progress * 100}%`}, () => {})
        })
        el.classList.add(profiles.Statistics.Medals.Quick["Club"].cssClass);
        return el;
    }

    for(let el of document.querySelectorAll("[pr-el=panel-medals]")) {
        let stats = profiles.Statistics.Medals;
        let outer = D2.Div("panel-stats panel-medals-outer " + stats.Quick.Club.cssClass, () => {
            D2.Image("rank-image", "/public/img/clubs/" + stats.Quick.Club.rank + ".png", "medal")
            D2.Text("p", "Medals");
            D2.StyledText("h1", `<strong>${stats.Quick.Club.rank}% Club</strong>`);
            // we don't have this data yet
            D2.StyledText("h2", `<strong>#${stats.Ranks.Global}</strong> Global`)
            let country = D2.StyledText("h3", `<strong>#${stats.Ranks.Country}</strong> Country`);
            D2.Div("footerarea", () => {
                D2.StyledText("p", `<strong>${stats.TotalAchieved} medals</strong> (${stats.Quick.Percentage}%)`);
                // TODO: progress bar
                let currentMedals = profiles.User.user_achievements.length;
                let nextClub = stats.Quick.Club.Next();
                if(nextClub !== null) {
                    let vx = D2.StyledText("p", (nextClub.GetCount(stats.TotalReleased) - stats.TotalAchieved) + " until ", "next-medals");
                    vx.appendChild(D2.Image("rank-image-small", `/public/img/clubs/${nextClub.rank}.png`))
                    vx.setAttribute("tooltip", (nextClub.GetCount(stats.TotalReleased) - stats.TotalAchieved) + " medals to go until you get to " + nextClub.rank + "% club!");
                } else {
                    let vx = D2.Text("p", "At the top.");
                }
            })

            medalProgressBar()
        });
        el.innerHTML = "";
        el.appendChild(outer);
    }



    function tab_Medals() {
        let stats = profiles.Statistics.Medals;

        for(let el of document.querySelectorAll("[pr-el=medals-club-badge]")) {
            el.src = `/public/img/clubs/${stats.Quick.Club.rank}.png`;
        }
        for(let el of document.querySelectorAll("[pr-el=medals-club-class]")) {
            el.classList.add(stats.Quick.Club.cssClass);
        }
        for(let el of document.querySelectorAll("[pr-el=medals-club-name]")) {
            el.innerText = stats.Quick.Club.name;
        }

        for(let el of document.querySelectorAll("[pr-el=medals-club-next-badge]")) {
            let nextClub = stats.Quick.Club.Next();
            if(nextClub !== null) {
                el.src = `/public/img/clubs/${nextClub.rank}.png`;
            } else {
                el.src = "/public/img/clubs/0.png";
            }
        }
        for(let el of document.querySelectorAll("[pr-el=medals-club-next-class]")) {
            let nextClub = stats.Quick.Club.Next();
            if(nextClub !== null) {
                el.classList.add(nextClub.cssClass);
            }
        }
        for(let el of document.querySelectorAll("[pr-el=medals-club-next-name]")) {
            let nextClub = stats.Quick.Club.Next();
            if(nextClub !== null) {
                el.innerText = nextClub.name;
            }
        }
        for(let el of document.querySelectorAll("[pr-el=medals-club-next-togo]")) {
            let nextClub = stats.Quick.Club.Next();
            if(nextClub !== null) {
                let currentMedals = profiles.User.user_achievements.length;
                let nextMedals = nextClub.GetCount(stats.TotalReleased);
                el.innerText = (nextMedals - currentMedals);
            } else {
                el.innerText = "";
            }
        }

        for(let el of document.querySelectorAll("[pr-el=medals-percentage]")) {
            el.innerText = stats.Quick.Percentage + "%";
        }
        for(let el of document.querySelectorAll("[pr-el=medals-total-achieved]")) {
            el.innerText = stats.TotalAchieved;
        }
        for(let el of document.querySelectorAll("[pr-el=medals-total-released]")) {
            el.innerText = stats.TotalReleased;
        }




        for(let el of document.querySelectorAll("[pr-el=medals-global-rank]")) {
            el.innerText = "#"+stats.Ranks.Global;
        }
        for(let el of document.querySelectorAll("[pr-el=medals-country-rank]")) {
            el.innerText = "#"+stats.Ranks.Country;
        }



        for(let el of document.querySelectorAll("[pr-el=medals-progressbar]")) {
            el.innerHTML = "";
            el.appendChild(medalProgressBar());
        }
    }

    tab_Medals()



    function forwardFill(data) {
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


    let data = profiles.Graphs.MedalPercentageOverTime.Relative.map(d => ({
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
Load();