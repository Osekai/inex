import { removeItemAll } from "../utils/array";

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
    constructor(output, input, callback, renderer = BaseRenderer, options = {
        "searchType": "find"
    }) {
        this.output = output;
        this.input = input;
        this.callback = callback;
        this.renderer = renderer;
        this.options = options;

        input.addEventListener("keydown", (e) => {
            if(this.original_items == null) return;
            if (e.keyCode === 38) {
                if (this.any_selected_ak) this.Move(-1);
                else {
                    this.any_selected_ak = true;
                    this.Move(0)
                }
            }
            else if (e.keyCode === 40) {
                if (this.any_selected_ak) this.Move(1);
                else {
                    this.any_selected_ak = true;
                    this.Move(0)
                }
            }
            else if (e.keyCode == 13) {
                this.Click(this.index)
            } else {
                if (this.options.searchType == "find") {
                    var filtered = [];
                    for (var item of this.original_items) {
                        if (typeof (item.category) != "undefined" || item.category != null) {
                            filtered.push(item);
                            continue;
                        }
                        if (item[this.key].toLowerCase().includes(input.value.toLowerCase())) {
                            filtered.push(item);
                        }
                    }
                    this.Set(filtered, this.key);
                }
                if (options.searchType == "fetch") {
                    // ! TODO: api searching
                }
            }
        });
    }
    any_selected_ak = false;

    original_items = null;
    filtered_items_nocat = null;
    filtered_items = [];
    elements = [];
    index = 0;
    key = "name";

    multiselect = false;
    selected = [];


    defualt_name = null;
    last_index = null;

    Move(direction) {
        var temp = this.index + direction;
        if (temp < 0 || temp >= this.filtered_items_nocat.length) {
            return;
        }
        this.elements[this.index].classList.remove("selected");
        this.index += direction;
        this.last_index = this.filtered_items_nocat[this.index][this.key];
        if (this.any_selected_ak) {
            this.elements[this.index].classList.add("selected");
        }
    }

    SetDefaults(array) {
        var countFound = 0;
        for(let name of array) {
            if(countFound => array.length) return;
            this.defualt_name = name;
            var x = -1;
            for (var item of this.filtered_items) {
                x++;
                if (typeof (item.category) != "undefined" || item.category != null) {
                    continue;
                }
                if (item[this.key] == name) {
                    this.elements[this.index].classList.remove("selected");
                    this.index = x;
                    countFound++;
                    break;
                }
            }
            this.Click(index);
        }
    }

    Click(index) {
        if (this.multiselect) {
            if (this.selected.includes(this.filtered_items_nocat[index])) {
                this.elements[index].classList.remove("ms-selected");
                removeItemAll(this.selected, this.filtered_items_nocat[index]);
            } else {
                this.elements[index].classList.add("ms-selected");
                this.selected.push(this.filtered_items_nocat[index]);
            }
        }

        if(this.filtered_items_nocat[index] === undefined) return;
        this.callback(this.filtered_items_nocat[index]);
    }

    Set(_items, _key, _multiselect, defaultSelection = null) {
        this.multiselect = _multiselect;
        this.index = 0;
        this.elements = [];
        this.filtered_items = _items;
        if (this.original_items == null) {
            this.original_items = _items;
        }
        this.key = _key;
        this.output.innerHTML = "";
        var count = 0;
        var last_category_header = null;
        this.filtered_items_nocat = [];
        for (let item of this.filtered_items) {
            if (typeof (item.category) != "undefined" || item.category != null) {
                if (last_category_header != null) {
                    last_category_header.innerText = item.category;
                    continue;
                }
                var header = document.createElement("h1");
                last_category_header = header;
                header.innerText = item.category;
                this.output.appendChild(header);
                continue;
            }
            this.filtered_items_nocat.push(item);
            last_category_header = null;
            let object = this.renderer(item, this.key);
            for (var sitem of this.selected) {
                if (sitem[this.key] === item[this.key]) {
                    object.classList.add("ms-selected");
                }
            }
            this.elements.push(object);
            this.output.appendChild(object);
            let thiscount = count;
            object.addEventListener("click", () => {
                this.Click(thiscount);
            })

            if(defaultSelection == thiscount && defaultSelection != null) {
                this.Click(thiscount);
            }
            if (this.original_items != null) {
                if (item[this.key] == this.last_index) {
                    this.index = thiscount;
                }
            }
            count++;
        }
        this.Move(0);
    }
}

export {EasySelector};