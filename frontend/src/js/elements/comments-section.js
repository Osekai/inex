import '../../css/elements/comments-section.css'

import {DoRequest} from "../utils/requests";
import {Div, Text, Image, Button, LucideIcon} from "../utils/dom";
import {timeAgo} from "../utils/timeago";
import {Modal, ModalButton, ModalIcon} from "../ui/overlay";

class CommentsSection extends HTMLElement {

    section = "unknown";
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
        const outerDiv = Div("div", "comment-inner");
        const commentChildren = Div("div", "comment-children");

        if (toplevel) outerContainer.classList.add("toplevel")


        const userPfp = document.createElement("a")
        userPfp.appendChild(Image(`/img/user/${comment.poster.id}/pfp/tiny?t=${comment.poster.pfptime}`));
        userPfp.href = "/@" + comment.poster.tag;

        const right = Div();

        const top = Div("div", "comment-top");
        const content = Div("div", "comment-content");
        const toolbar = Div("div", "comment-toolbar");

        var topLeft = Div("div", "comment-top-left");
        var topRight = Div("div", "comment-top-right");

        const name = Text("a", comment.poster.name);
        name.href = "/@" + comment.poster.tag;
        const tag = Text("small", "@" + comment.poster.tag); // lol

        topLeft.appendChild(name);
        topLeft.appendChild(tag);

        const timeSince = Text("p", timeAgo.format(new Date(comment.date + " UTC")));

        topRight.appendChild(timeSince);

        top.append(topLeft);
        top.append(topRight);

        right.appendChild(top);
        right.appendChild(content);
        right.appendChild(toolbar);

        outerDiv.appendChild(userPfp);
        outerDiv.appendChild(right);
        if (loggedIn) {
            var replyButton = Div("div", "comment-toolbar-button");
            replyButton.appendChild(LucideIcon("reply"));
            replyButton.appendChild(Text("p", "Reply"));

            toolbar.appendChild(replyButton);
            if (comment.poster.id === userData.ID) {
                var deleteButton = Div("div", "comment-toolbar-button");
                deleteButton.appendChild(LucideIcon("trash-2"));
                deleteButton.appendChild(Text("p", "Delete"));

                toolbar.appendChild(deleteButton);

                deleteButton.addEventListener("click", () => {
                    var modal = new Modal("Are you sure you want to delete this comment?", "This cannot be undone!", [new ModalButton("Delete", async () => {
                        outerContainer.classList.add("loading");
                        await DoRequest("POST", `/api/comment/${comment.id}/delete`);
                        outerContainer.remove();
                        modal.close();
                    }), new ModalButton("Cancel", () => {
                        modal.close();
                    })], new ModalIcon("alert-triangle", "#ff623e"));
                })
            }
        }


        const commentText = Text("p", comment.content);
        content.appendChild(commentText);


        outerContainer.appendChild(outerDiv);
        outerContainer.appendChild(commentChildren);

        if (comment.children.length > 0) {
            for (let child of comment.children) {
                commentChildren.appendChild(this.createComment(child, false));
            }
        }

        replyButton.addEventListener("click", () => {
            console.log("hii hello :333")
            var donew = true;
            if (this.replyPanel != null) {
                if (this.replyPanel.parent === comment.id) {
                    donew = false;
                }
                this.replyPanel.remove();
                this.replyPanel = null;
            }
            if (donew) {
                this.replyPanel = this.commentBar(comment.id);
                this.replyPanel.parent = comment.id;
                commentChildren.prepend(this.replyPanel);
            }
        })

        return outerContainer;
    }

    async load() {
        if (this.getAttribute("section") == null) {
            this.innerHTML = "<warning>No section ID specified! Please contact support</warning>";
        }
        this.section = this.getAttribute("section");
        const data = (await DoRequest("POST", `/api/comments/${this.section}/get`))["content"];
        console.log(data);

        this.appendChild(this.commentBar());
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