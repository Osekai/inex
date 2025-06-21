import {Button, Div, LucideIcon, Text, TextArea} from "../utils/dom";
import {Overlay} from "./overlay";

export function reportOverlay(titleText, callback) {

    const element = document.createElement("div");

    const panel = Div("div", "basic-modal basic-modal-input character-creator-panel");
    element.appendChild(panel);

    const title = Text("h1", titleText);

    const nameInput = TextArea("");
    nameInput.setAttribute("type", "character");

    const buttonRow = Div("div", "button-row");
    const cancelButton = Button("Cancel");
    const continueButton = Button("Send", "cta");

    panel.appendChild(LucideIcon("triangle-alert"));
    panel.appendChild(title);
    panel.appendChild(nameInput);
    buttonRow.appendChild(cancelButton);
    buttonRow.appendChild(continueButton);
    panel.appendChild(buttonRow);

    continueButton.classList.add("disabled");

    nameInput.addEventListener("keyup", () => {
        if (nameInput.textLength > 0) {
            continueButton.classList.remove("disabled");
        } else {
            continueButton.classList.add("disabled");
        }
    })


    const overlay = new Overlay(element);
    overlay.allowclickoff = false;
    cancelButton.addEventListener("click", () => {
        overlay.remove();
    })
    continueButton.addEventListener("click", async () => {
        panel.classList.add("loading");
        await callback(nameInput.value);
        overlay.remove();
    });
}