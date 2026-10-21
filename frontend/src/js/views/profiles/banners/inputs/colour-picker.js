import iro from "@jaames/iro";
import {Input} from "../input";
import {D2} from "../../../../utils/d2";
import {Dropdown} from "../../../../ui/dropdown";

export class ColourPicker extends Input {
    constructor(data, cb) {
        super();
        
        const startColour = data.default || "#ffffff";
        
        let swatchBtn, dropdown, pickerHost, hexInput, outerHexInput;
        
        let container = null;
        if (data.compact) {
            // just a hex chip filled with the colour, used by the gradient input
            container = D2.Div("colour-picker-input compact", () => {
                outerHexInput = D2.Input("", "text", startColour);
                swatchBtn = D2.CustomPlus("button", "colour-picker-swatch", {type: "button"});
            });
        } else {
            container = D2.Div("colour-picker-input", () => {
                D2.Div("input-with-text slide colour-picker-input-outer", () => {
                    D2.Text("p", data.name);
                    outerHexInput = D2.Input(" ", "text", startColour);
                    swatchBtn = D2.CustomPlus("button", "colour-picker-swatch", {type: "button"});
                });
            });
        }
        dropdown = D2.CustomPlus("div", "colour-picker-dropdown dropdown-content", {
            "dropdown": "",
            "dropdown-pos": "bottom start",
        }, () => {
            pickerHost = D2.Div("colour-picker-widget");
            D2.Div("input-with-text slide", () => {
                D2.Text("p", "Hex");
                hexInput = D2.Input("", "text", startColour);
            });
        });
        document.body.appendChild(dropdown);
        
        swatchBtn.style.setProperty("--swatch-colour", startColour);
        container.style.setProperty("--swatch-colour", startColour);
        
        this.value = startColour;
        this.el = container;
        
        // iro is only actually mounted once the dropdown is opened for the first
        // time - creating it eagerly for every colour input on the page would be
        // wasteful, most of them never get opened in a given editing session
        let picker = null;
        const ensurePicker = () => {
            if (picker) return picker;
            picker = new iro.ColorPicker(pickerHost, {
                width: 240,
                color: this.value,
                layout: [
                    {component: iro.ui.Box},
                    {
                        component: iro.ui.Slider,
                        options: {sliderType: "hue"},
                    },
                ],
            });
            
            picker.on("color:change", (colour) => {
                this.value = colour.hexString;
                swatchBtn.style.setProperty("--swatch-colour", this.value);
                container.style.setProperty("--swatch-colour", this.value);
                hexInput.value = this.value;
                outerHexInput.value = this.value;
                cb(this.value);
            });
            
            return picker;
        };
        
        const applyHex = (input) => {
            const val = input.value.trim();
            // let iro validate/normalize - it'll throw on a genuinely bad value,
            // so just ignore the input rather than crash the editor over it
            try {
                ensurePicker().color.hexString = val;
            } catch {
                input.value = this.value;
            }
        };
        
        hexInput.addEventListener("change", () => applyHex(hexInput));
        outerHexInput.addEventListener("change", () => applyHex(outerHexInput));
        
        let dd = new Dropdown(dropdown, swatchBtn);

        // clicking into the hex field opens the picker too, without pulling focus out of it
        outerHexInput.setAttribute("dropdown-button", "");
        outerHexInput.addEventListener("focus", () => {
            dd.open(false);
        });
        dropdown.addEventListener("open", () => {
            ensurePicker();
        });
    }
}
