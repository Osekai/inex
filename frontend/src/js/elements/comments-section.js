import '../../css/elements/comments-section.css'

import {DoRequest} from "../utils/requests";
import {Button, Div, LucideIcon, Text, Image} from "../utils/dom";
import {timeAgo} from "../utils/timeago";
import bbCodeParser from 'js-bbcode-parser';

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
        console.log(comment);


        var commentOuter = Div("div", "comment-" + (toplevel ? "outer" : "reply"));

        const outerContainer = Div("div", "comment");

        var commentContainer = Div("div", "comment-inner");
        var replyContainer = Div("div", "comment-replies");








        var name = Div("div", "name");
        name.appendChild(Image("https://a.ppy.sh/" + comment.User_ID));
        name.appendChild(Text("h1", comment.User_ID));
        name.appendChild(Text("h3", timeAgo.format(new Date(comment.Date))));

        var content = Div("div", "content");
        content.innerHTML = bbCodeParser.parse(comment.Text);

        outerContainer.appendChild(name);
        outerContainer.appendChild(content);

        var toolbar = Div("div", "toolbar");



        var upvote = Text("button", "0");
        upvote.prepend(LucideIcon("thumbs-up"));
        var reply = Text("button", "Reply");
        reply.prepend(LucideIcon("reply"));
        toolbar.appendChild(upvote);
        toolbar.appendChild(reply);


        if (toplevel && comment.Replies>0) {
            var viewReplies = Div("button", "view-replies");
            viewReplies.innerText = comment.Replies + " Replies";
            viewReplies.prepend(LucideIcon("chevron-down"));
            toolbar.appendChild(viewReplies);
            viewReplies.classList.add("right");
        }




        outerContainer.appendChild(toolbar);
        outerContainer.appendChild(replyContainer);

        let loaded = false;

        if (toplevel && comment.Replies>0) {
            viewReplies.addEventListener("click", async () => {
                if(!loaded) {
                    var replies = (await DoRequest("POST", `/api/comments/${this.section}/${this.ref}/get`, {
                        "ParentID": comment.ID
                    }))["content"];
                    for (let reply of replies) {
                        replyContainer.appendChild(this.createComment(reply, false))
                    }
                    loaded = true;
                }
                commentOuter.classList.toggle("replies-opened");
            })
        }

        commentOuter.appendChild(outerContainer);
        return commentOuter;
    }

    async loadComments(ref) {
        this.ref = ref;
        console.log("letsa go");
        this.listElement.innerHTML = loader;
        const data = (await DoRequest("POST", `/api/comments/${this.section}/${ref}/get`))["content"];
        this.listElement.innerHTML = "";
        for (let comment of data) {
            this.listElement.appendChild(this.createComment(comment));
        }
    }

    async load() {
        this.appendChild(this.commentBar());

        this.section = this.getAttribute("section");
        this.ref = this.getAttribute("ref");

        if (this.getAttribute("autoload")) {
            this.loadComments(this.ref);
        }

        this.listElement = Div();

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

export default CommentsSection;