import {MedalsUI} from "./medals/MedalsUI";

import {getSections, setSections} from "../utils/urlQuery";
import {DoRequest} from "../utils/requests";
import {MedalUtils} from "./medals/MedalUtils";
import {MedalData} from "./medals/MedalData";
import {Button, Div, Input, LucideIcon, Text} from "../utils/dom";

import "../../css/views/medals.css";
import {Overlay} from "../ui/overlay";
import {PushToast} from "../ui/toasts";
import {MedalsSidebar} from "./medals/ui/MedalsSidebar";
import {OnChangeSetting} from "../utils/usersettings";
import {Initialize} from "./medals/MedalsAdmin";
import {PermissionChecker} from "../utils/permissionChecker";
import {MedalsSuggestions} from "./medals/ui/MedalsSuggestions";
import {D2} from "../utils/d2";

export * from "./medals/SolutionElements.js";

if (PermissionChecker("medal.edit", false)) {
    Initialize();
}

function GetMedalFromUrl() {

    SetMedal(decodeURIComponent((getSections(`/medals/{medal}`))['medal']), false, true);
}

document.getElementById("back").addEventListener("click", () => {
    SetMedal("", true);
});

window.addEventListener("popstate", () => {
    GetMedalFromUrl();
})


/**
 * Sets medal based on input
 * @param inputMedal : string/number Medal name OR Medal ID (ID preferred)
 * @param setUrl : boolean Should we update the URL? this manages history, too.
 * @param scrollTo
 */
export function SetMedal(inputMedal, setUrl = false, scrollTo = false) {
    if (inputMedal == null || inputMedal === "" || typeof (inputMedal) == "undefined" || inputMedal === "undefined") {
        document.getElementById("medal-home").classList.remove("_hidden");
        document.getElementById("medal-info").classList.add("_hidden");


        document.getElementById("medal-page").classList.add("home");
        if ((getSections(`/medals/{medal}`))['medal'] != null)
            setSections("/medals/{medal}", {"medal": ""});

        if (document.querySelector(".medals__medal-button.active")) document.querySelector(".medals__medal-button.active").classList.remove("active");

        return;
    } else {
        document.getElementById("medal-page").classList.remove("home");
    }
    let isnumber = false;
    if (parseInt(inputMedal) == inputMedal) {
        inputMedal = parseInt(inputMedal);
    }
    if (typeof (inputMedal) !== "number") {
        inputMedal = decodeURI(inputMedal.replace("_", " ").replace("+", " "));
    } else {
        isnumber = true;
    }

    var currentMedal = MedalUtils.GetMedalFromName(inputMedal); // will check ID afterward in case

    if (setUrl) {
        setSections(`/medals/{medal}`, {"medal": currentMedal.Name})
    }
    MedalData.CurrentMedal = currentMedal.Medal_ID;
    if (sidebar != null) sidebar.TempExpandMedal(currentMedal.Medal_ID);
    MedalsUI.LoadMedal(currentMedal, scrollTo);
    for (var button of document.querySelectorAll("[medal-button-id]")) {

        if (button.getAttribute("medal-button-id") == currentMedal.Medal_ID) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    }
    if (isnumber) {
        // update URL to name
        setSections(`/medals/{medal}`, {"medal": currentMedal.Name}, false)
    }

    // scroll to top
    document.getElementById("main-col").scrollTop = 0;
}

var sidebar = null;

async function Load() {
    await MedalData.GetMedals();
    sidebar = new MedalsSidebar();
    sidebar.LoadSidebar();
    let suggestions = new MedalsSuggestions();
    suggestions.Load();

    MedalsUI.Init();

    GetMedalFromUrl();


    if (loggedIn) {
        document.getElementById("medal_beatmaps_add").addEventListener("click", () => {
            var panel = Div("div", "basic-modal basic-modal-input");
            var overlay = new Overlay(panel)
            overlay.allowclickoff = false;

            panel.appendChild(LucideIcon("package-plus"));
            panel.appendChild(Text("h1", "Add beatmap"));
            var input = Input("Beatmap URL", "text")
            var note = Input("Note (optional)", "text")

            var buttons = Div("div", "button-row");

            var done = Button("Add", "button cta");
            var cancel = Button("Nevermind", "button");

            done.addEventListener("click", async () => {
                var resp = await DoRequest("POST", "/api/medals/" + MedalUtils.GetCurrentMedal().Medal_ID + "/beatmap/add", {
                    "url": input.value,
                    "note": note.value
                })
                if (resp.success === true) {
                    overlay.remove();
                    PushToast({
                        "theme": "success",
                        content: "Added beatmap!"
                    });
                    var grid = document.getElementById("medal_beatmaps");
                    grid.prepend(MedalsUI.AddBeatmap(resp.content, grid));
                } else {
                    PushToast({
                        "theme": "error",
                        content: resp.message
                    });
                }
            })
            cancel.addEventListener("click", () => {
                overlay.remove();
            })


            panel.appendChild(input);
            panel.appendChild(note);
            buttons.appendChild(done);
            buttons.appendChild(cancel);
            panel.appendChild(buttons);
        })
    } else {
        document.getElementById("medal_beatmaps_add").classList.add("disabled");
    }





    const medals = MedalData.GetMedalsSync();
    const loadPromises = [];

    for (let _medal in medals) {
        let medal = medals[_medal];
        let newIcon = document.createElement("medal-icon");
        newIcon.setAttribute("fancy", "false");
        newIcon.setAttribute("src", medal.Link);
        newIcon.setAttribute("preload-remove", "yeah ok");

        // wait for this icon to finish loading (or fail) before counting it as done
        const iconLoaded = new Promise((resolve) => {
            newIcon.addEventListener("load", resolve, { once: true });
            newIcon.addEventListener("error", resolve, { once: true });
        });
        loadPromises.push(iconLoaded);

        document.body.appendChild(newIcon); // don't forget to actually add it somewhere
    }

    Promise.all(loadPromises).then(() => {
        document.body.classList.add("medals-loaded");
        for (let a of document.querySelectorAll("[preload-remove]")) {
            a.remove();
        }
    });
}

Load().then(r => {
    console.log("load complete")
});

if (loggedIn) {
    let toolbar = document.querySelector(".sidebar-md-toolbar");
    let filterButton = document.getElementById("filter-button");

    let filterOptions = D2.Div("medals__filter-options", () => {
        let options = {
            "all": {"icon": "eye", "title": "Show All"},
            "mark": {"icon": "filter", "title": "Mark Achieved"},
            "hide": {"icon": "filter-x", "title": "Hide Achieved"}
        };
        for (let filter in options) {
            let option = D2.CustomPlus("button", "button", {}, () => {
                D2.LucideIcon(options[filter].icon);
                D2.Text("span", options[filter].title);
            });
            if (filter === MedalData.GetObtainedFilter()) {
                option.classList.add("active");
            }

            option.addEventListener("click", () => {
                for (let other of filterOptions.children) {
                    other.classList.remove("active");
                }
                option.classList.add("active");
                MedalData.SetObtainedFilter(filter);
                toolbar.classList.remove("filter-open");
            });
        }
    });
    filterButton.after(filterOptions);

    filterButton.addEventListener("click", () => {
        toolbar.classList.toggle("filter-open");
    });
}
