import '../../css/elements/comments-section.css'

import {DoRequest} from "../utils/requests";
import {Div, Text, Image, Button, LucideIcon} from "../utils/dom";
import {timeAgo} from "../utils/timeago";
import {Modal, ModalButton, ModalIcon} from "../ui/overlay";

class CommentsSection extends HTMLElement {

    section = 0;
    ref = "unknown";
    replyPanel = null;

    constructor() {
        super();
    }

    listElement = null;

    commentBar(replyingTo = null) {
        // note! : please pass in as Comment object and not ID!
        const outer = new Div("div", "comment-input");
        if (loggedIn) {
            const input = document.createElement("textarea");
            outer.appendChild(input);

            const button = Button(LucideIcon("send"));
            outer.appendChild(button);

            input.classList.add("input");
            input.classList.add("lighter");
            input.setAttribute("placeholder", "Leave a comment");


            button.addEventListener("click", async () => {
                if (input.value == "") return;
                const data = {
                    "content": input.value
                };
                if (replyingTo != null) data.replyingTo = replyingTo;

                console.log(data);

                const commentJson = await DoRequest("POST", `/api/comments/${this.section}/send`, data);
                console.log(commentJson);
                const comment = this.createComment(commentJson["content"]);
                if (replyingTo == null) {
                    // we're toplevel, don't want to replace
                    this.listElement.prepend(comment);
                } else {
                    outer.replaceWith(comment);
                }
                // i don't know which one of these work so take them all :)
                input.innerHTML = ""
                input.innerText = ""
                input.value = ""
                console.log(":)");
            })
        }
        return outer;
    }

    createComment(comment, toplevel = true) {
        const outerContainer = Div("div", "comment");

        outerContainer.appendChild(Text("p", comment.Text))


        //replyButton.addEventListener("click", () => {
        //    console.log("hii hello :333")
        //    var donew = true;
        //    if (this.replyPanel != null) {
        //        if (this.replyPanel.parent === comment.id) {
        //            donew = false;
        //        }
        //        this.replyPanel.remove();
        //        this.replyPanel = null;
        //    }
        //    if (donew) {
        //        this.replyPanel = this.commentBar(comment.id);
        //        this.replyPanel.parent = comment.id;
        //        commentChildren.prepend(this.replyPanel);
        //    }
        //})

        return outerContainer;
    }

    async load() {
        if (this.getAttribute("section") == null) {
            this.innerHTML = "<warning>No section ID specified! Please contact support</warning>";
        }

        this.appendChild(this.commentBar());

        this.section = this.getAttribute("section");
        this.ref = this.getAttribute("ref");
        const data = (await DoRequest("POST", `/api/comments/${this.ref}/${this.section}/get`))["content"];
        console.log(data);

        this.listElement = Div();
        for (let comment of data) {
            this.listElement.appendChild(this.createComment(comment));
        }

        this.appendChild(this.listElement);
    }

    async connectedCallback() {
        await this.load();
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

customElements.define("comments-section", CommentsSection);

export default {CommentsSection};