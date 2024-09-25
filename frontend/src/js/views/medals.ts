import {MedalsUI} from "./medals/MedalsUI";

export * from "./medals/MedalsAdmin";
import {getSections, setSections} from "../utils/urlQuery";
import {DoRequest} from "../utils/requests";
import {MedalUtils} from "./medals/MedalUtils";
import {MedalData} from "./medals/MedalData";
import {AntheraIcon, Div, Image, Input, LucideIcon, Text} from "../utils/dom";

import "../../css/views/medals.css";
import {Medal} from "./medals/Medal";
import {Misc} from "../utils/misc";
import {Overlay} from "../ui/overlay";
import {PushToast} from "../ui/toasts";
import {MedalsSidebar} from "./medals/ui/MedalsSidebar";
import {Currency} from "lucide";

function GetMedalFromUrl() {
    SetMedal((<any>getSections(`/medals/{medal}`))['medal']);
}



/**
 * Sets medal based on input
 * @param inputMedal : string/number Medal name OR Medal ID (ID preferred)
 * @param setUrl : boolean Should we update the URL? this manages history, too.
 */
export function SetMedal(inputMedal: string | number, setUrl = false) {
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
    MedalsUI.LoadMedal(currentMedal);
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

            panel.appendChild(Text("h1", "Add beatmap"));
            var input = Input("Beatmap URL", "text")
            var note = Input("Note (optional)", "text")
            var done = Div("button", "button cta");
            done.innerText = "Add";

            done.addEventListener("click", async () => {
                var resp = await DoRequest("POST", "/api/medals/" + MedalUtils.GetCurrentMedal().Medal_ID + "/beatmap/add", {
                    "url": input.value,
                    "note": note.value
                })
                if(resp.success == true) {
                    overlay.overlay.remove();
                    PushToast({"theme": "success", content: "Added beatmap!"});
                    MedalsUI.AddBeatmap(resp.content);
                } else {
                    PushToast({"theme": "error", content: resp.message});
                }
            })

            panel.appendChild(input);
            panel.appendChild(note);
            panel.appendChild(done);
        })
    }
}

Load().then(r => {
    console.log("load complete")
});
