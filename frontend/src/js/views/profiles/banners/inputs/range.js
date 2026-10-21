import {Input} from "../input";
import {D2} from "../../../../utils/d2";

export class Range extends Input {
    constructor(data, cb) {
        super();

        const slider = document.createElement("input");
        slider.classList.add("slider");
        slider.type = "range";
        slider.min = data.values.start;
        slider.max = data.values.end;
        slider.value = data.default || data.values.start;

        const numberInput = document.createElement("input");
        numberInput.type = "number";
        numberInput.min = data.values.start;
        numberInput.max = data.values.end;
        numberInput.value = data.default || data.values.start;
        numberInput.classList.add("input");

        const syncValues = (value) => {
            value = Math.min(Math.max(value, data.values.start), data.values.end); // Clamp value
            slider.value = value;
            numberInput.value = value;
            this.value = value;
            slider.style.setProperty("--value", value);
            cb(this.value);
        };
        slider.style.setProperty("--value", slider.value);

        slider.addEventListener("input", (e) => syncValues(parseInt(e.target.value)));
        numberInput.addEventListener("input", (e) => syncValues(parseInt(e.target.value)));

        this.el = D2.Div("input-with-text", () => {
            D2.Text("p", data.name);
            D2.Div("slider-with-input", () => [slider, numberInput]);
        });
    }
}
