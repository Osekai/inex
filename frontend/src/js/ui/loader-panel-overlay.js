import {Div} from "../utils/dom";

function LoaderPanelOverlay() {
    var outer = Object.assign(document.createElement("div"), {"style": "margin: auto;"});
    outer.innerHTML += loaderSmall;
    return outer;
}

export {LoaderPanelOverlay};