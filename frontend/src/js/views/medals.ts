// @ts-nocheck
// note: typescript is great for giving me classes and interfaces etc.... but i despise the checking it does

import {MedalsUI} from "./medals/MedalsUI";

export * from "./medals/MedalsAdmin";
import {getSections, setSections} from "../utils/urlQuery";
import {DoRequest} from "../utils/requests";
import {MedalUtils} from "./medals/MedalUtils";
import {MedalData} from "./medals/MedalData";
import {Div, Image, Text} from "../utils/dom";

import "../../css/views/medals.css";
import {Medal} from "./medals/Medal";
import {Misc} from "../utils/misc";

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
    console.log(inputMedal);
    var currentMedal = MedalUtils.GetMedalFromName(inputMedal); // will check ID afterward in case
    console.log(currentMedal);
    if (setUrl) {
        setSections(`/medals/{medal}`, {"medal": currentMedal.Name})
    }
    MedalData.CurrentMedal = currentMedal.Medal_ID;
    MedalsUI.LoadMedal(currentMedal);
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

    console.log(categorized);



    for(var category in categorized) {
        var categorydiv = Div("div", "medals__medal-section");
        var header = Text("h1", category);
        var grid = Div("div", "medals__medal-grid");

        for (let medal of categorized[category]) {
            let medalButton = Div("button", "medals__medal-button");
            medalButton.append(Image(medal.Link, "", true))
            medalButton.setAttribute("tooltip", medal.Name)

            medalButton.addEventListener("click", () => {
                console.log(medal);
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
    console.log(MedalData.GetMedalsSync());
    LoadSidebar();
    GetMedalFromUrl();
}

Load().then(r => {
    console.log("load complete")
});