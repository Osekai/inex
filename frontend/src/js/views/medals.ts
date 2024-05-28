import {getSections, setSections} from "../utils/urlQuery";
import {DoRequest} from "../utils/requests";
import {MedalUtils} from "./medals/MedalUtils";
import {MedalData} from "./medals/MedalData";
import {Div, Image} from "../utils/dom";

import "../../css/views/medals.css";
import {Medal} from "./medals/Medal";

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
    LoadMedal(currentMedal);
}

/**
 * @param medal : Medal
 * @function
 */
function LoadMedal(medal: Medal) {
    console.log(medal);

    (<HTMLImageElement>document.getElementById("medal_image")).src = medal.Link;

    document.getElementById("medal_name").innerText = medal.Name;
    document.getElementById("medal_description").innerText = medal.Description;
    document.getElementById("medal_instructions").innerHTML = medal.Instructions; // instructions have <i> sometimes

    document.getElementById("medal_solution").innerHTML = medal.Solution;
}

function LoadSidebar() {
    var sidebar = document.getElementById("sidebar");

    for (let medal of MedalData.GetMedalsSync()) {
        let medalButton = Div("button", "medals__medal-button");
        medalButton.append(Image(medal.Link, "", true))
        medalButton.setAttribute("tooltip", medal.Name)
        sidebar.append(medalButton);

        medalButton.addEventListener("click", () => {
            console.log(medal);
            SetMedal(medal['Medal_ID'], true);
        })
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