import {Div} from "../utils/dom";

function LoaderPanelOverlay() {
    var outer = Object.assign(document.createElement("div"), {"style": "margin: auto; width: 100%; min-height: 100px; display: flex; align-items: center; justify-content: center;"});
    outer.innerHTML += loader;
    return outer;
}

export {LoaderPanelOverlay};