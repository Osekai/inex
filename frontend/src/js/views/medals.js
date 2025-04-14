import {MedalsUI} from "./medals/MedalsUI";

import {getSections, setSections} from "../utils/urlQuery";
import {DoRequest} from "../utils/requests";
import {MedalUtils} from "./medals/MedalUtils";
import {MedalData} from "./medals/MedalData";
import {AntheraIcon, Button, Div, Image, Input, LucideIcon, Text} from "../utils/dom";

import "../../css/views/medals.css";
import {Medal} from "./medals/Medal";
import {Misc} from "../utils/misc";
import {Overlay} from "../ui/overlay";
import {PushToast} from "../ui/toasts";
import {MedalsSidebar} from "./medals/ui/MedalsSidebar";
import {Currency} from "lucide";
import {GetSetting, OnChangeSetting} from "../utils/usersettings";
import {Initialize} from "./medals/MedalsAdmin";
import {PermissionChecker} from "../utils/permissionChecker";

export * from "./medals/SolutionElements.js";

if(PermissionChecker("medal.edit", false)) {
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
    if(inputMedal == null || inputMedal === "" || typeof(inputMedal) == "undefined" || inputMedal === "undefined") {
        document.getElementById("medal-home").classList.remove("_hidden");
        document.getElementById("medal-info").classList.add("_hidden");


        document.getElementById("medal-page").classList.add("home");
        if((getSections(`/medals/{medal}`))['medal'] != null)
        setSections("/medals/{medal}", {"medal": ""});

        if(document.querySelector(".medals__medal-button.active")) document.querySelector(".medals__medal-button.active").classList.remove("active");

        return;
    } else {
        document.getElementById("medal-page").classList.remove("home");
    }
    if (typeof (inputMedal) !== "number") {
        inputMedal = decodeURI(inputMedal.replace("_", " "));
    }

    var currentMedal = MedalUtils.GetMedalFromName(inputMedal); // will check ID afterward in case

    if (setUrl) {
        setSections(`/medals/{medal}`, {"medal": currentMedal.Name})
    }
    MedalData.CurrentMedal = currentMedal.Medal_ID;
    MedalsUI.LoadMedal(currentMedal,scrollTo);
    for(var button of document.querySelectorAll("[medal-button-id]")) {
        // @ts-ignore
        if(button.getAttribute("medal-button-id") === currentMedal.Medal_ID) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    }
}

var sidebar = null;
async function Load() {
    await MedalData.GetMedals();
    sidebar = new MedalsSidebar();
    sidebar.LoadSidebar();
    OnChangeSetting("medals.hideUnachievedMedals", () => {
        //sidebar.LoadSidebar();
    })
    GetMedalFromUrl();

    // @ts-ignore
    if(loggedIn) {
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
                if(resp.success === true) {
                    overlay.remove();
                    PushToast({"theme": "success", content: "Added beatmap!"});
                    var grid = document.getElementById("medal_beatmaps");
                    grid.prepend(MedalsUI.AddBeatmap(resp.content, grid));
                } else {
                    PushToast({"theme": "error", content: resp.message});
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
}

Load().then(r => {
    console.log("load complete")
});

var filterbutton = document.getElementById("filter-button");
filterbutton.addEventListener("click", () => {
    if(MedalData.ObtainedFilterActive()) {
        MedalData.SetObtainedFilterActive(false);
    } else {
        MedalData.SetObtainedFilterActive(true);
    }
})
