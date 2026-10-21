import {Input} from "../input";
import {Range} from "./range";

// ported from anthera, just a range with a rainbow track
export class ColorHue extends Input {
    constructor(data, cb) {
        super();

        const slider = new Range({
            ...data,
            values: {start: 0, end: 360},
        }, (value) => {
            this.value = value;
            cb(value);
        });

        slider.el.querySelector(".slider-with-input").classList.add("hue");
        this.el = slider.el;
    }
}
