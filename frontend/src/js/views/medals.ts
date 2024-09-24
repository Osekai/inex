// @ts-nocheck
// note: typescript is great for giving me classes and interfaces etc.... but i despise the checking it does

import {MedalsUI} from "./medals/MedalsUI";

export * from "./medals/MedalsAdmin";
import {getSections, setSections} from "../utils/urlQuery";
import {DoRequest} from "../utils/requests";
import {MedalUtils} from "./medals/MedalUtils";
import {MedalData} from "./medals/MedalData";
import {Div, Image, Input, Text} from "../utils/dom";

import "../../css/views/medals.css";
import {Medal} from "./medals/Medal";
import {Misc} from "../utils/misc";
import {Overlay} from "../ui/overlay";
import {PushToast} from "../ui/toasts";

function GetMedalFromUrl() {
    SetMedal((<any>getSections(`/medals/{medal}`))['medal']);
}



/**
 * Sets medal based on input
 * @param inputMedal : string/number Medal name OR Medal ID (ID preferred)
 * @param setUrl : boolean Should we update the URL? this manages history, too.
 */
function SetMedal(inputMedal: string | number, setUrl = false) {
    if (typeof (inputMedal) !== "number") {
        inputMedal = decodeURI(inputMedal.replace("_", " "));
    }

    var currentMedal = MedalUtils.GetMedalFromName(inputMedal); // will check ID afterward in case

    if (setUrl) {
        setSections(`/medals/{medal}`, {"medal": currentMedal.Name})
    }
    MedalData.CurrentMedal = currentMedal.Medal_ID;
    MedalsUI.LoadMedal(currentMedal);
    for(var button of document.querySelectorAll("[medal-button-id]")) {
        if(button.getAttribute("medal-button-id") == currentMedal.Medal_ID) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    }
}

/**
 * @param medal : Medal
 * @function
 */

function LoadSidebar() {
    var sidebar = document.getElementById("sidebar");

    var categorized: {} = {};

    for(var cat of Misc.Medals.GroupingOrdering) {
        categorized[cat] = [];
    }

    for(let medal of Object.values(MedalData.GetMedalsSync())) {
        if(typeof(categorized[medal.Grouping as keyof typeof categorized]) == "undefined") {
            // @ts-ignore
            categorized[medal.Grouping] = [];
        }

        // @ts-ignore
        categorized[medal.Grouping].push(medal);
    }



    for(var category in categorized) {
        var categorydiv = Div("div", "medals__medal-section");
        var header = Text("h1", category);
        var grid = Div("div", "medals__medal-grid");

        for (let medal of categorized[category]) {
            let medalButton = Div("button", "medals__medal-button");
            medalButton.append(Image(medal.Link, "", true))
            medalButton.setAttribute("tooltip", medal.Name)

            medalButton.setAttribute("medal-button-id", medal.Medal_ID);

            medalButton.addEventListener("click", () => {
                SetMedal(medal['Medal_ID'], true);
            })

            grid.appendChild(medalButton);
        }

        categorydiv.appendChild(header);
        categorydiv.appendChild(grid);
        sidebar.append(categorydiv);

    }


}

async function Load() {
    await MedalData.GetMedals()
    LoadSidebar();
    GetMedalFromUrl();

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
