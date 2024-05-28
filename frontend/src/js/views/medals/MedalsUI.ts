import {Medal} from "./Medal";

export class MedalsUI {
    static LoadMedal(medal: Medal) {
        console.log(medal);

        (<HTMLImageElement>document.getElementById("medal_image")).src = medal.Link;

        document.getElementById("medal_name").innerText = medal.Name;
        document.getElementById("medal_description").innerText = medal.Description;
        document.getElementById("medal_instructions").innerHTML = medal.Instructions; // instructions have <i> sometimes

        document.getElementById("medal_solution").innerHTML = medal.Solution;
    }

}