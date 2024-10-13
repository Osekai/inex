import {StarRatingColour, StarRatingColourText} from "../../utils/starRatingColour";
import {Div, LucideIcon} from "../../utils/dom";

export class StarRating extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        var rating = parseFloat(this.innerText);

        var inner = Div();

        inner.innerHTML = this.innerHTML;
        inner.prepend(LucideIcon("star"))

        this.innerHTML = "";
        this.appendChild(inner);

        //inner.style.backgroundColor = StarRatingColour(rating);
        //inner.style.color = StarRatingColourText(rating);

        inner.style.setProperty("--background", StarRatingColour(rating));
        inner.style.setProperty("--foreground", StarRatingColourText(rating));
    }
}

customElements.define("star-rating", StarRating);

export class Note extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        var text = Div("p");
        text.innerHTML = this.innerHTML;

        this.innerHTML = "";

        this.classList.add("solution-note");
        this.classList.add(this.nodeName);

        var icon = LucideIcon("book-plus");
        var tooltip = "Solution Note";
        this.style.setProperty("--background", "#fffa");

        if(this.nodeName === "STABLE-DIFFERENCE") {
            icon = LucideIcon("triangle-alert");
            tooltip = "Stable Differences"
            this.style.setProperty("--background", "#dd4a68");
        }

        if(this.hasAttribute("advice")) {
            icon = LucideIcon("hand-helping");
            tooltip = "Advice"
            this.style.setProperty("--background", "#39FFA0");
        }


        icon.setAttribute("tooltip", tooltip);

        this.appendChild(icon);
        this.appendChild(text);
    }
}
export class StableDifference extends Note {}
customElements.define("solution-note", Note);
customElements.define("stable-difference", StableDifference);