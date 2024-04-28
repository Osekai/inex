import {Button, Div, LucideIcon, Text} from "../utils/dom";

export class Overlay {
    overlay = null;
    constructor(element, hpos = "center", vpos = "center") {
        this.overlay = document.createElement("div");
        this.overlay.classList.add("overlay")
        this.overlay.classList.add("hpos-"+hpos)
        this.overlay.classList.add("vpos-"+vpos)
        this.overlay.appendChild(element);
        document.body.appendChild(this.overlay);
    }
}

export class ModalButton {
    text = "";
    callback = () => {};
    constructor(text, callback) {
        this.text = text;
        this.callback = callback;
    }
}
export class ModalIcon {
    name = "";
    colour = "";
    constructor(name, colour = "#ffffff") {
        this.name = name;
        this.colour = colour;
    }
}
export class Modal {
    title;
    description;
    buttons;
    overlay;
    constructor(title, description, buttons, icon = null) {
        this.title = title;
        this.description = description;
        this.buttons = buttons;

        var inner = Div("div", "basic-modal");
        var eltitle = Text("h1", title);
        var eldesc = Text("h3", description);

        inner.appendChild(eltitle);
        inner.appendChild(eldesc);

        var elbuttons = Div("div", "buttons");

        for(let button of buttons) {
            var elbutton = Button(button.text);
            elbutton.addEventListener("click", button.callback);
            elbuttons.appendChild(elbutton);
        }
        inner.appendChild(elbuttons);

        if(icon != null) {
            var elicon = Div("div", "icon");
            var eliconInner = LucideIcon(icon.name);
            elicon.appendChild(eliconInner);
            inner.prepend(elicon);
            elicon.style = "--col: " + icon.colour;
        }

        this.overlay = new Overlay(inner);
    }

    close() {
        console.log("closing ?");
        this.overlay.overlay.remove();
    }
}
