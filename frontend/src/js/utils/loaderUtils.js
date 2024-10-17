import {Div} from "./dom";

export function CenteredLoader() {
    var d = Div("div", "loader-centered");
    d.innerHTML = loader;
    return d;
}