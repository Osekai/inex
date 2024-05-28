import {Overlay} from "../../ui/overlay";
import {Checkbox, Div, Input, InputText, InputTextarea, Text} from "../../utils/dom";
import {MedalData} from "./MedalData";
import {MedalsUI} from "./MedalsUI";
import {removeItemAll} from "../../utils/array";

console.log("medals admin");

var currentUnsavedMedals: string[] = [];

function ShowUnsavedOverlay() {
    var container = document.getElementById("unsaved-medals");
    if(currentUnsavedMedals.length == 0) {
        container.classList.add("hidden");
    } else {
        container.classList.remove("hidden");
        container.innerText = "!! You have unsaved medals! : " + currentUnsavedMedals.join(", ");
    }
}

function OpenEditor() {
    console.log("gm");
    var medal = MedalData.CurrentMedal;
    var panel = Div("div", "panel");
    var overlay = new Overlay(panel);

    var inputContainer = Div("div", "inputs");

    panel.appendChild(Text("h1", "Edit " + medal.Name))
    panel.appendChild(Div("div", "divider"));


    var inputs: any = {};
    inputs["Solution"] = InputTextarea("Solution", "text", medal.Solution);
    inputs["Date_Released"] = InputText("Date Released", "date", medal.Date_Released);

    inputs["Video_URL"] = InputText("Video URL", "text", medal.Video_URL);

    inputs["Is_Lazer"] = Checkbox("Supports Lazer", medal.Is_Lazer);
    inputs["Is_Restricted"] = Checkbox("Restrict Beatmaps", medal.Is_Restricted);


    inputs["First_Achieved_Date"] = InputText("First Achieved", "date", medal.First_Achieved_Date);
    inputs["First_Achieved_User_ID"] = InputText("First Achieved By", "number", <string><unknown>medal.First_Achieved_User_ID);

    inputContainer.appendChild(inputs['Solution'].element);


    var otherInfo = Div("div", "row");
    otherInfo.appendChild(inputs['Video_URL'].element);
    otherInfo.appendChild(inputs['Is_Lazer'].element);
    otherInfo.appendChild(inputs['Is_Restricted'].element);

    var basicInfo = Div("div", "row");
    basicInfo.appendChild(inputs["Date_Released"].element);
    basicInfo.appendChild(inputs["First_Achieved_Date"].element);
    basicInfo.appendChild(inputs["First_Achieved_User_ID"].element);


    inputContainer.appendChild(otherInfo);
    inputContainer.appendChild(basicInfo);

    panel.appendChild(inputContainer);

    var right = Div("div", "button-row");

    var button = Div("button", "button cta");
    button.innerText = "Save Changes";

    var button2 = Div("button", "button");
    button2.innerText = "Preview Changes";

    var button3 = Div("button", "button warning");
    button3.innerText = "Close without saving";

    right.appendChild(button3);
    right.appendChild(button2);
    right.appendChild(button);

    panel.appendChild(right);

    function SetChanges() {

        for (var input in inputs) {
            // @ts-ignore
            medal[input] = inputs[input].value();
        }

        for (var gmedal of MedalData.Medals) {
            if (gmedal.Medal_ID == medal.Medal_ID) {
                gmedal = medal;
                console.log("Saved medal locally");
                console.log(gmedal);
                MedalsUI.LoadMedal(gmedal);
            }
        }
    }


    var PreviewChanges = () => {
        SetChanges();
        overlay.overlay.remove();
        if (!(medal.Name in currentUnsavedMedals))
            currentUnsavedMedals.push(medal.Name);
        ShowUnsavedOverlay();
    }

    var SaveChanges = () => {
        SetChanges();
        removeItemAll(currentUnsavedMedals, medal.Name);
        overlay.overlay.remove();
        ShowUnsavedOverlay();
    }

    button.addEventListener("click", SaveChanges);
    button2.addEventListener("click", PreviewChanges);
    button3.addEventListener("click", () => {
        overlay.overlay.remove();
    });


}

document.getElementById("medal-edit-button").addEventListener("click", OpenEditor);

export {OpenEditor} // note: export is unused but if we don't have it the file wont be included