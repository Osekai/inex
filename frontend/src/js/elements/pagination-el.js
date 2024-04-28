import '../../css/elements/pagination-el.css'

import {removeItemAll} from "../../index.js";
import {Button, Div, Text} from "../utils/dom";
import {getParam, insertParam} from "../utils/urlQuery";

class PaginationEl extends HTMLElement {
    constructor() {
        super();
    }

    page = 0;
    maxPages = 0;
    friends = [];

    pagetext = Text("p", "Page is " + (this.page + 1))
    buttonContainer = Div();
    event = new Event("page");
    changePage(dir) {
        this.page += dir;
        if (this.page < 0) {
            this.page = 0;
            return;
        }
        if (this.page > this.maxPages) {
            this.page = this.maxPages;
            return;
        }
    }

    setPage(page) {
        this.page = page;
        this.pageButtons(this.page, this.maxPages)
    }
    broadcastPage() {
        for (var friend of this.friends) {
            friend.setPage(this.page);
        }
        this.event.page = this.page;
        this.dispatchEvent(this.event);
        insertParam(this.key, this.page+1)
    }

    pageButtons(currentPage, maxPages) {
        currentPage++;
        maxPages++;

        const numButtons = 7; // Number of buttons to show
        const halfNumButtons = Math.floor(numButtons / 2);

        let startPage = currentPage - halfNumButtons;
        let endPage = currentPage + halfNumButtons;

        // Ensure start and end pages are within bounds
        if (startPage < 1) {
            startPage = 1;
            endPage = Math.min(startPage + numButtons - 1, maxPages);
        }

        if (endPage > maxPages) {
            endPage = maxPages;
            startPage = Math.max(endPage - numButtons + 1, 1);
        }

        const buttons = [];

        // Middle buttons
        for (let i = startPage; i <= endPage; i++) {
            const button = { page: i };
            if (i === currentPage) {
                button.selected = true;
            } else {
                button.selected = false;
            }
            buttons.push(button);
        }

        if(buttons[0].selected == false && buttons[0].page != 1) {
            buttons[0].page = 1;
            buttons[0].special = true;
        }
        if(buttons[buttons.length-1].selected == false && buttons[buttons.length-1].page != maxPages) {
            buttons[buttons.length-1].page = maxPages;
            buttons[buttons.length-1].special = true;
        }

        this.buttonContainer.innerHTML = "";
        for(let button of buttons) {
            let buttonDiv = Div();
            buttonDiv.appendChild(Text("button", button.page));
            if(button.selected) buttonDiv.classList.add("selected")
            if(button.special) buttonDiv.classList.add("special")

            this.buttonContainer.appendChild(buttonDiv)
            buttonDiv.addEventListener("click", () => {
                this.setPage(button.page-1);
                this.broadcastPage(this);
            })
        }
    }

    primary = false;

    initialize(limit, max_count) {
        if(this.getAttribute("primary") != null) this.primary = true
        console.log("reinitializing pag");

        this.friends = document.querySelectorAll("[link-id=" + this.getAttribute("link-id") + "]");

        this.maxPages = Math.ceil(max_count / limit) - 1;
        this.innerHTML = "";
        console.log(limit);

        var next = Button("next");
        var prev = Button("prev");


        var pushpage = (dir) => {
            var lastpage = this.page;
            this.changePage(dir);
            if (this.page == lastpage) return;
            this.broadcastPage()
        }
        next.addEventListener("click", () => {
            pushpage(1);
        })
        prev.addEventListener("click", () => {
            pushpage(-1);
        })


        this.appendChild(prev);
        this.appendChild(this.buttonContainer);
        this.pageButtons(this.page, this.maxPages)
        this.appendChild(next);

        if(getParam(this.key) != null && this.primary) {
            this.setPage(parseInt(getParam(this.key))-1);
            if(this.page != 0) this.broadcastPage(this);
        }

    }


    key = "";
    connectedCallback() {
        this.key = this.getAttribute("link-id");
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

customElements.define("pagination-el", PaginationEl);

export default {PaginationEl};