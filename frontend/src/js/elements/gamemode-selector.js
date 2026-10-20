import '../../css/elements/gamemode-selector.css'

const MODES = [
    {"Key": "osu", "Name": "osu!"},
    {"Key": "taiko", "Name": "osu!taiko"},
    {"Key": "catch", "Name": "osu!catch"},
    {"Key": "mania", "Name": "osu!mania"},
];

// <gamemode-selector value="osu" allow-all disabled>
// allow-all adds an "any mode" option with the value ""
// fires "change" with the new value in e.detail
export default class GamemodeSelector extends HTMLElement {
    constructor() {
        super();
    }

    buttons = [];
    built = false;
    _value = "osu";

    connectedCallback() {
        if (this.built) return;
        this.built = true;

        if (this.hasAttribute("value")) this._value = this.getAttribute("value");

        let modes = [...MODES];
        if (this.hasAttribute("allow-all")) {
            modes.unshift({"Key": "", "Name": "Any mode"});
        }

        for (let mode of modes) {
            let button = document.createElement("div");
            button.classList.add("gamemode-selector-button");
            button.setAttribute("tooltip", mode.Name);
            button.modeKey = mode.Key;

            let icon = document.createElement("i");
            if (mode.Key == "") {
                icon.className = "icon-gamemode-all";
            } else {
                icon.className = "icon-gamemode-" + mode.Key;
            }
            button.appendChild(icon);

            button.addEventListener("click", () => {
                if (this.hasAttribute("disabled")) return;
                this.value = mode.Key;
                this.dispatchEvent(new CustomEvent("change", {
                    detail: mode.Key,
                    bubbles: true
                }));
            });

            this.buttons.push(button);
            this.appendChild(button);
        }

        this.updateButtons();
    }

    get value() {
        return this._value;
    }

    set value(value) {
        // osu api calls it fruits
        if (value == "fruits") value = "catch";
        if (value === null) value = "";
        this._value = value;
        this.updateButtons();
    }

    updateButtons() {
        for (let button of this.buttons) {
            button.classList.toggle("active", button.modeKey == this._value);
        }
    }
}

try {
    customElements.define("gamemode-selector", GamemodeSelector)
} catch {}
