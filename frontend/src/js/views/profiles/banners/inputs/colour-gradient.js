import {Input} from "../input";
import {D2} from "../../../../utils/d2";
import {ColourPicker} from "./colour-picker";

// first colour on the left, a preview of the gradient in the middle, the rest on the right
// banners split them into --dyn-key-1, --dyn-key-2 etc
export class ColourGradient extends Input {
    constructor(data, cb) {
        super();

        this.value = [...data.default];

        let preview = null;
        let pickers = [];
        for (let i = 0; i < this.value.length; i++) {
            let picker = new ColourPicker({
                name: data.name + " " + (i + 1),
                default: this.value[i],
                compact: true,
            }, (colour) => {
                this.value[i] = colour;
                this.updatePreview(preview);
                cb([...this.value]);
            });
            pickers.push(picker.el);
        }

        this.el = D2.Div("colour-gradient-input", () => {
            D2.Text("p", data.name, "colour-gradient-label");
            D2.Div("colour-gradient-row", () => {
                let row = [pickers[0]];
                preview = D2.Div("colour-gradient-preview", () => {
                });
                row.push(preview);
                for (let i = 1; i < pickers.length; i++) {
                    row.push(pickers[i]);
                }
                return row;
            });
        });

        this.updatePreview(preview);
    }

    updatePreview(preview) {
        preview.style.background = "linear-gradient(90deg, " + this.value.join(", ") + ")";
    }
}
