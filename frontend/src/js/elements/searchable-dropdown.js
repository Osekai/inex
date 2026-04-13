

import {BlurAll} from "../utils/dom.js";
import {EasySelector} from "../ui/easyselector.js";
import {Dropdown} from "../ui/dropdown";
import {D2} from "../utils/d2";

class SearchableDropdown extends HTMLElement {
    constructor() {
        super();
        this.callback = null;
        this.selectedObj = null;
        this.dropdownContent = null;
        this.ignoredIDs = [];
        this.items = [];
        this.keyname = "name";
        this.arrowKeyDirector = null;
    }

    create(
        items = [
            {"category": "CATEGORY 1"},
            {"name": "cute art :3"},
            {"name": "3D Art"},
            {"category": "CATEGORY 2"},
            {"name": "Digital Art"},
            {"name": "Traditional Art"},
        ],
        keyname = "name",
        Defaultselected = 0,
        dropdownText = "",
        callback = null
    ) {
        this.callback = callback;
        this.items = items;
        this.keyname = keyname;

        // filter items based on ignoredIDs
        const filteredItems = items.filter(item => !this.ignoredIDs.includes(item[keyname]));

        let showSelected = true;
        if (dropdownText !== "" && dropdownText !== null) {
            showSelected = false;
        }

        let that = this;
        let selected = null;

        let dropdown = Object.assign(document.createElement("button"), {
            "innerText": filteredItems[0]?.[keyname] || ""
        });
        dropdown.classList = this.classList + " dropdown";
        if (!showSelected) {
            dropdown.innerText = dropdownText;
        }

        let dropdownContent = Object.assign(document.createElement("div"), {"className": "dropdown-content"});
        let dropdownSearchContainer = Object.assign(document.createElement("div"), {"className": "dropdown-search-container"});
        let dropdownSearchIcon = D2.LucideIcon("search");
        let dropdownSearch = Object.assign(document.createElement("input"), {"className": "dropdown-search"});

        dropdownSearchContainer.appendChild(dropdownSearchIcon);
        dropdownSearchContainer.appendChild(dropdownSearch);
        let dropdownInner = Object.assign(document.createElement("div"), {"className": "dropdown-inner"});

        var dd = new Dropdown(dropdownContent, dropdown);

        let arrowKeyDirector = new EasySelector(
            dropdownInner,
            dropdownSearch,
            (item) => {
                dd.close();
                BlurAll();
                if (showSelected)
                    dropdown.innerText = item[keyname];
                selected = item[keyname];
                this.selectedObj = item;
                arrowKeyDirector.SetDefaults([selected]);
                if (that.callback != null) {
                    that.callback(item);
                }
                arrowKeyDirector.clearSearchAndReset();
                this.dispatchEvent(new CustomEvent('change', {
                    detail: item,
                    bubbles: true,
                    composed: true
                }));
            }
        );

        arrowKeyDirector.Set(filteredItems, keyname, false, Defaultselected);

        dropdownContent.appendChild(dropdownSearchContainer);
        dropdownContent.appendChild(dropdownInner);
        this.appendChild(dropdown);
        this.appendChild(dropdownContent);

        this.dropdownContent = dropdownContent;
        this.arrowKeyDirector = arrowKeyDirector;
    }

    setIgnoredIDs(key, value) {

    }

    disconnectedCallback() {}

    static get observedAttributes() {
        return [];
    }

    attributeChangedCallback(name, oldValue, newValue) {}

    adoptedCallback() {}
}

try {
    customElements.define("searchable-dropdown", SearchableDropdown)
} catch {}

export default {SearchableDropdown};
