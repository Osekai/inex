import {Input} from "../input";
import {D2} from "../../../../utils/d2";
import SearchableDropdown from "../../../../elements/searchable-dropdown";

export class Enum extends Input {
    constructor(data, cb) {
        super();
        var dropdown = document.createElement("searchable-dropdown");
        var defaultNum = 0;
        for (var i of data.values) {
            if (i.key !== data.default) {
                defaultNum++;
            } else {
                break;
            }
        }

        var last = data.default;
        dropdown.create(data.values, "name", defaultNum, null, (item) => {
            this.value = item.key;
            if(item.key !== last) {
                cb(this.value);
                last = item.key;
            }
        });

        this.el = D2.Div("input-with-text slide", () => {
            D2.Text("p", data.name);
            return dropdown;
        });
    }
}
