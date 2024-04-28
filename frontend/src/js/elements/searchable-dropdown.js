import {BlurAll, LucideIcon} from "../utils/dom";
import {EasySelector} from "../ui/easyselector";

class SearchableDropdown extends HTMLElement {
    constructor() {
        super();
    }
    callback = null;
    selectedObj = null;
    create(items = [
        {
            "category": "CATEGORY 1",
        },
        {
            "name": "cute art :3"
        },
        {
            "name": "3D Art"
        },
        {
            "category": "CATEGORY 2",
        },
        {
            "name": "Digital Art"
        },
        {
            "name": "Traditional Art"
        },
    ], keyname = "name", Defaultselected = 0, dropdownText = "", callback = null) {
        this.callback = callback;
        var showSelected = true;
        if(dropdownText !== "") {
            showSelected = false;
        }
        var that = this;
        var selected = null;
        var dropdown = Object.assign(document.createElement("div"), {"innerText": items[1][keyname], "className": "dropdown"});
        if(!showSelected) {
            dropdown.innerText = dropdownText;
        }
        var dropdownContent = Object.assign(document.createElement("div"), {"className": "dropdown-content"})
        var dropdownSearchContainer = Object.assign(document.createElement("div"), {"className": "dropdown-search-container"});
        var dropdownSearchIcon = LucideIcon("search");
        var dropdownSearch = Object.assign(document.createElement("input"), {"className": "dropdown-search"});
        dropdownSearchContainer.appendChild(dropdownSearchIcon);
        dropdownSearchContainer.appendChild(dropdownSearch);
        var dropdownInner = Object.assign(document.createElement("div"), {"className": "dropdown-inner"});
        var arrowKeyDirector = new EasySelector(
            dropdownInner,
            dropdownSearch,
             (item) => {
                dropdownContent.classList.remove("dropdown-open")
                BlurAll();
                if(showSelected)
                dropdown.innerText = item[keyname];
                selected = item[keyname];
                this.selectedObj = item;
                arrowKeyDirector.SetDefaults([selected])
                 if(that.callback != null) {
                     that.callback(item);
                 }
            }
        )
        dropdown.addEventListener("click", () => {
            if(dropdownContent.classList.contains("dropdown-open")) {
                dropdownContent.classList.remove("dropdown-open")
                BlurAll();
            } else {
                dropdownContent.classList.add("dropdown-open")
                dropdownSearch.focus();
            }
        });
        arrowKeyDirector.Set(items, keyname, false, Defaultselected);
        dropdownContent.appendChild(dropdownSearchContainer);
        dropdownContent.appendChild(dropdownInner);
        this.appendChild(dropdown)
        this.appendChild(dropdownContent);
    }

    disconnectedCallback() {

    }

    static get observedAttributes() {
        return [];
    }

    attributeChangedCallback(name, oldValue, newValue) {

    }

    adoptedCallback() {

    }
}
customElements.define("searchable-dropdown", SearchableDropdown);

export default {SearchableDropdown};