import '../../css/elements/medal-icon.css'
import {MedalIcons} from "../data/MedalIcons";
import {rgbToHsl} from "../utils/colour";


class MedalIcon extends HTMLElement {

    base;
    icon;

    constructor() {
        super();
    }

    static get observedAttributes() {
        return ["src"];
    }

    async load(key) {
        if (key.endsWith(".png")) key = key.substring(0, key.length - 4);
        this.innerHTML = "";
        const iconData = await MedalIcons.GetIconWithBase(key);

        const parse = (svgString) => {
            const tmp = document.createElement("div");
            tmp.innerHTML = svgString;
            return tmp.querySelector("svg");
        };

        const base = parse(iconData.base.svg);
        const icon = parse(iconData.svg);

        this.innerHTML = "";
        if (base) this.appendChild(base);
        if (icon) this.appendChild(icon);

        base.classList.add("base");
        icon.classList.add("icon");

        this.base = base;
        this.icon = icon;


        this.dispatchEvent(new Event("load"));
    }

    getColour() {
        // this is slightly silly and could be precomputed easily but it's safer this way
        
        let paths = this.base.querySelectorAll("path");
        let first = paths[0];

        let colour = window.getComputedStyle(first).fill;
        const [r, g, b] = colour.match(/[\d.]+/g).map(Number);
        let hsl = rgbToHsl(r, g, b);
        console.log("hsl", hsl);
        return hsl;
    }

    connectedCallback() {

    }

    disconnectedCallback() {

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "src") {
            this.load(newValue);
        }
    }

    adoptedCallback() {

    }
}

try {
    customElements.define("medal-icon", MedalIcon);
} catch {

}
export default MedalIcon;