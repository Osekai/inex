import {Medal} from "./Medal";
import {MedalData} from "./MedalData";

export class MedalsUI {
    static LoadBeatmaps(medal : Medal) {
        console.log("beatmaps are supposedly loaded for medal " + medal.Medal_ID);
        console.log(medal);
    }
    static LoadMedal(medal: Medal) {
        MedalData.LoadExtra(medal, {
            "beatmaps": this.LoadBeatmaps
        });
        console.log(medal);

        (<HTMLImageElement>document.getElementById("medal_image")).src = medal.Link;

        document.getElementById("medal_name").innerText = medal.Name;
        document.getElementById("medal_description").innerText = medal.Description;
        document.getElementById("medal_instructions").innerHTML = medal.Instructions; // instructions have <i> sometimes

        document.getElementById("medal_solution").innerHTML = medal.Solution;
    }

}