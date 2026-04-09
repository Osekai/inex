

import { removeItemAll } from "../utils/array.js";

function BaseRenderer(item, key) {
    var p = document.createElement("p");
    p.innerHTML = item[key];
    return p;
}

class EasySelector {
    output = null;
    input = null;
    callback = null;
    renderer = null;
    options = null;

    original_items = null;
    filtered_items = [];
    filtered_items_nocat = [];
    elements = [];

    index = 0;
    last_index = null;
    key = "name";

    multiselect = false;
    selected = []; // always an array

    defualt_name = null;
    any_selected_ak = false;

    constructor(
        output,
        input,
        callback,
        renderer = BaseRenderer,
        options = { searchType: "find" }
    ) {
        this.output = output;
        this.input = input;
        this.callback = callback;
        this.renderer = renderer;
        this.options = options;

        this.input.addEventListener("keydown", (e) => {
            const isEnter = e.keyCode === 13;

            setTimeout(() => {
                if (!this.original_items) return;

                if (e.keyCode === 38) {
                    this.Move(-1);
                } else if (e.keyCode === 40) {
                    this.Move(1);
                } else {
                    if (this.options.searchType === "find") {
                        let filtered = [];

                        for (let item of this.original_items) {
                            if (item["fds-alwaysShow"] === true) {
                                filtered.push(item);
                                continue;
                            }
                            if (typeof item.category !== "undefined" && item.category != null) {
                                filtered.push(item);
                                continue;
                            }
                            if (
                                item[this.key] &&
                                item[this.key]
                                    .toLowerCase()
                                    .includes(this.input.value.toLowerCase())
                            ) {
                                filtered.push(item);
                            }
                        }

                        this.Set(filtered, this.key, this.multiselect);
                        this.index = 0;
                        this.Move(0);
                    }

                    if (this.options.searchType === "fetch") {
                        // TODO: api searching
                    }
                }

                if (isEnter) {
                    this.Click(this.index);
                }
            }, 1);
        });

        setTimeout(() => {
            this.clearSearchAndReset();
        }, 2);
    }

    Move(direction) {
        const newIndex = this.index + direction;

        if (newIndex < 0 || newIndex >= this.filtered_items_nocat.length) return;

        // clear old selection highlight
        if (this.elements[this.index])
            this.elements[this.index].classList.remove("selected");

        this.index = newIndex;
        this.last_index = this.filtered_items_nocat[this.index][this.key];

        // clear all selected class to avoid duplicates
        this.elements.forEach((el) => el.classList.remove("selected"));

        // highlight current element
        if (this.elements[this.index]) this.elements[this.index].classList.add("selected");
    }

    SetDefaults(namesArray) {
        if (!Array.isArray(namesArray)) return;

        for (const name of namesArray) {
            for (let i = 0; i < this.filtered_items.length; i++) {
                const item = this.filtered_items[i];

                if (typeof item.category !== "undefined" && item.category != null) continue;

                try {
                    if (item[this.key] === name) {
                        // clear previous visual highlight
                        if (this.elements[this.index])
                            this.elements[this.index].classList.remove("selected");

                        this.index = i;

                        // highlight new selected visually (but no callback)
                        this.elements[this.index].classList.add("selected");

                        // update last_index
                        this.last_index = this.filtered_items_nocat[this.index][this.key];

                        break;
                    }
                } catch {}
            }
        }
    }

    Click(index) {
        if (!this.filtered_items_nocat[index]) return;

        const selectedItem = this.filtered_items_nocat[index];

        if (this.multiselect) {
            if (this.selected.includes(selectedItem)) {
                this.elements[index].classList.remove("ms-selected");
                removeItemAll(this.selected, selectedItem);
            } else {
                this.elements[index].classList.add("ms-selected");
                this.selected.push(selectedItem);
            }
        } else {
            // clear previous ms-selected styles
            this.elements.forEach((el) => el.classList.remove("ms-selected"));

            // update selected to array with one item
            this.selected = [selectedItem];

            // apply ms-selected style on current element
            this.elements[index].classList.add("ms-selected");
        }

        this.callback(selectedItem);
    }

    clearSearchAndReset() {
        if (this.input) {
            this.input.value = "";
        }
        // reset the list to original items, no multiselect, no default selection
        this.Set(this.original_items || [], this.key, this.multiselect, null);
    }

    Set(_items, _key, _multiselect = false, defaultSelection = null) {
        this.multiselect = _multiselect;
        this.index = 0;
        this.elements = [];
        this.filtered_items = _items;

        // clear container only once here
        this.output.innerHTML = "";

        // set original_items only once, copy to avoid mutations
        if (this.original_items == null) this.original_items = _items.slice();

        this.key = _key;

        let last_category_header = null;
        this.filtered_items_nocat = [];

        for (const item of this.filtered_items) {
            if (typeof item.category !== "undefined" && item.category != null) {
                if (last_category_header != null) {
                    last_category_header.innerText = item.category;
                    continue;
                }
                const header = document.createElement("h1");
                last_category_header = header;
                header.innerText = item.category;
                this.output.appendChild(header);
                continue;
            }

            this.filtered_items_nocat.push(item);
            last_category_header = null;

            const element = this.renderer(item, this.key);

            if (Array.isArray(this.selected)) {
                for (const sitem of this.selected) {
                    if (sitem[this.key] === item[this.key]) {
                        element.classList.add("ms-selected");
                    }
                }
            }

            this.elements.push(element);
            this.output.appendChild(element);

            const nocatIndex = this.filtered_items_nocat.length - 1;

            element.addEventListener("click", () => {
                this.Click(nocatIndex);
            });

            if (defaultSelection !== null && defaultSelection === nocatIndex) {
                this.Click(nocatIndex);
            }

            if (this.original_items && item[this.key] === this.last_index) {
                this.index = nocatIndex;
            }
        }

        if (Array.isArray(this.selected) && this.selected.length > 0) {
            for (let i = 0; i < this.filtered_items_nocat.length; i++) {
                if (this.filtered_items_nocat[i][this.key] === this.selected[0][this.key]) {
                    this.index = i;
                    break;
                }
            }
        }

        this.Move(0);
    }
}

export { EasySelector };
