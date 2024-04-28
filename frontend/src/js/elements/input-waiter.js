import {GetSetting, removeItemAll, SetSettings} from "../../index.js";
import {cloneAttributes, Div, LucideIcon} from "../utils/dom";
import '../../css/elements/input-waiter.css'
class InputWaiter extends HTMLElement {
    constructor() {
        super();
    }


    event = new Event("save");
    input = document.createElement("input");
    connectedCallback() {
        var input = this.input;

        cloneAttributes(this, input);
        input.classList.add("input");

        var loader = Div("div", "loader");
        loader.innerHTML = loaderSmall;

        var check = Div("div", "check");
        check.appendChild(LucideIcon("check"));

        var callback = async () => {
            console.log("callback");
            if(typeof(this.doneCallback) != "undefined") {
                await this.doneCallback();
            }
            this.classList.remove("saving");
            this.classList.add("saved");
        }
        var hitCallback = async () => {
            this.value = input.value;
            console.log("hitcallback");
            if(typeof(this.hitCallback) != "undefined") {
                await this.hitCallback();
            }
            this.classList.add("saving");
            this.classList.remove("saved");
        }

        let typingTimer;
        let typingTimerHit;

        var lastValue = "";
        input.addEventListener('keyup', () => {
            if(input.value === lastValue) return;
            lastValue = input.value;
            clearTimeout(typingTimer);
            if (input.value) {
                typingTimer = setTimeout(callback, 400);
                typingTimerHit = setTimeout(hitCallback, 50)
            }
        });


        this.appendChild(input);
        this.appendChild(loader);
        this.appendChild(check);
    }

    set(value) {
        this.input.value = value;
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

customElements.define("input-waiter", InputWaiter);

export default {InputWaiter};