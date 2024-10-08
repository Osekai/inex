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
import {GetSetting} from "../utils/usersettings";
import {Initialize} from "./medals/MedalsAdmin";
import {PermissionChecker} from "../utils/permissionChecker";

if(PermissionChecker("medal.edit", false)) {
    console.log("You have edit permissions");
    Initialize();
}

function GetMedalFromUrl() {

    SetMedal(decodeURIComponent((<any>getSections(`/medals/{medal}`))['medal']), false, true);
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
export function SetMedal(inputMedal: string | number, setUrl = false, scrollTo = false) {
    if(inputMedal == null || inputMedal == "") {
        document.getElementById("medal-page").classList.add("home");
        if((<any>getSections(`/medals/{medal}`))['medal'] != null)
        setSections("/medals/{medal}", {"medal": ""});
        return;
    } else {
        console.log(inputMedal);
        document.getElementById("medal-page").classList.remove("home");
    }
    if (typeof (inputMedal) !== "number") {
        inputMedal = decodeURI(inputMedal.replace("_", " "));
    }

    console.log(inputMedal);
    var currentMedal = MedalUtils.GetMedalFromName(inputMedal); // will check ID afterward in case
    console.log(currentMedal);

    if (setUrl) {
        setSections(`/medals/{medal}`, {"medal": currentMedal.Name})
    }
    MedalData.CurrentMedal = currentMedal.Medal_ID;
    MedalsUI.LoadMedal(currentMedal,scrollTo);
    for(var button of document.querySelectorAll("[medal-button-id]")) {
        // @ts-ignore
        if(button.getAttribute("medal-button-id") == currentMedal.Medal_ID) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    }
}


async function Load() {
    await MedalData.GetMedals();
    (new MedalsSidebar()).LoadSidebar();
    GetMedalFromUrl();

    // @ts-ignore
    if(loggedIn) {
        document.getElementById("medal_beatmaps_add").addEventListener("click", () => {
            var panel = Div("div", "panel");
            var overlay = new Overlay(panel)
            overlay.allowclickoff = false;

            panel.appendChild(Text("h1", "Add beatmap"));
            var input = Input("Beatmap URL", "text")
            var note = Input("Note (optional)", "text")
            var done = Button("Add", "button cta");
            var cancel = Button("Nevermind", "button");

            done.addEventListener("click", async () => {
                var resp = await DoRequest("POST", "/api/medals/" + MedalUtils.GetCurrentMedal().Medal_ID + "/beatmap/add", {
                    "url": input.value,
                    "note": note.value
                })
                if(resp.success == true) {
                    overlay.remove();
                    PushToast({"theme": "success", content: "Added beatmap!"});
                    MedalsUI.AddBeatmap(resp.content);
                } else {
                    PushToast({"theme": "error", content: resp.message});
                }
            })
            cancel.addEventListener("click", () => {
                overlay.remove();
            })

            panel.appendChild(input);
            panel.appendChild(note);
            panel.appendChild(done);
            panel.appendChild(cancel);
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