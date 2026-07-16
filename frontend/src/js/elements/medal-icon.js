import '../../css/elements/medal-icon.css'
import {MedalIcons} from "../data/MedalIcons";
import {rgbToHsl} from "../utils/colour";
import {D2} from "../utils/d2";


class MedalIcon extends HTMLElement {

    base;
    icon;
    fancy = true;

    constructor() {
        super();
    }

    static get observedAttributes() {
        return ["src", "fancy"];
    }

    async load(key) {
        if (key.endsWith(".png")) key = key.substring(0, key.length - 4);
        this.innerHTML = "";

        const iconData = await MedalIcons.GetIconWithBase(key);

        // generate a unique prefix for this instance's svg ids
        const uid = `medal-${Math.random().toString(36).slice(2, 8)}`;

        const parse = (svgString) => {
            // collect all ids first
            const ids = [...svgString.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);

            // rewrite each id and all its references in one pass per id
            let rewritten = svgString;
            for (const id of ids) {
                const newId = `${uid}-${id}`;
                // replace the definition
                rewritten = rewritten.replace(
                    new RegExp(`\\bid="${id}"`, 'g'),
                    `id="${newId}"`
                );
                // replace all url(#id) references
                rewritten = rewritten.replace(
                    new RegExp(`url\\(#${id}\\)`, 'g'),
                    `url(#${newId})`
                );
                // replace all href="#id" references
                rewritten = rewritten.replace(
                    new RegExp(`href="#${id}"`, 'g'),
                    `href="#${newId}"`
                );
            }

            const tmp = document.createElement("div");
            tmp.innerHTML = rewritten;
            return tmp.querySelector("svg");
        };

        let base = D2.Image("", "/assets/medals/bases/" + iconData.colour + ".png", "base");
        if(this.fancy) {
            base = parse(iconData.base.svg);
        }
        const icon = parse(iconData.svg);

        this.innerHTML = "";


        base.classList.add("base");
        icon.classList.add("icon");
        this.base = base;
        this.icon = icon;

        base.removeAttribute("width");
        base.removeAttribute("height");
        icon.removeAttribute("width");
        icon.removeAttribute("height");

        if (base) {
            let baseWrapper = document.createElement("div");
            baseWrapper.classList.add("base-wrapper");
            baseWrapper.appendChild(base);
            this.appendChild(baseWrapper);
        }
        if (icon) {
            let iconWrapper = document.createElement("div");
            iconWrapper.classList.add("icon-wrapper");
            iconWrapper.appendChild(icon);
            this.appendChild(iconWrapper);
        }

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
        if (name === "fancy") {
            this.fancy = newValue == "true";
            this.load(this.getAttribute("src"));
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