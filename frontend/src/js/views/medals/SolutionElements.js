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
        this.classList.add("solution-note");
        this.classList.add(this.nodeName);
        if(this.nodeName === "STABLE-DIFFERENCE") {
            this.prepend(LucideIcon("triangle-alert"));
        } else {
            this.prepend(LucideIcon("book-plus"));
        }
    }
}
export class StableDifference extends Note {}
customElements.define("solution-note", Note);
customElements.define("stable-difference", StableDifference);