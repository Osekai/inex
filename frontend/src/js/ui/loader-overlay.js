import {Overlay} from "./overlay";

class LoaderOverlay {
    overlay = null;
    constructor(text) {
        var outer = Object.assign(document.createElement("div"), {"className": "overlay__loader"});
        this.overlay = new Overlay(outer).overlay;
        outer.innerHTML += loader;
        outer.appendChild(Object.assign(document.createElement("p"), {"innerText": text}));
    }
}

export {LoaderOverlay};