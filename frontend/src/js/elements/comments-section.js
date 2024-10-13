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

    lastCommentBar = null;
    commentBar(replyingTo = null, hideParents = null) {
        // note! : please pass in as Comment object and not ID!
        const outer = new Div("div", "comment-input");
        if (loggedIn) {
            const input = document.createElement("textarea");
            input.rows = 1;
            outer.appendChild(input);

            const button = Button(LucideIcon("send"));
            outer.appendChild(button);

            input.classList.add("input");
            input.classList.add("lighter");
            input.setAttribute("placeholder", "Leave a " + (replyingTo == null ? "comment" :  "reply"));


            button.addEventListener("click", async () => {
                if (input.value == "") return;
                const data = {
                    "content": input.value
                };
                if (replyingTo != null) data.replyingTo = replyingTo;


                const commentJson = await DoRequest("POST", `/api/comments/${this.section}/${this.ref}/send`, data);

                const comment = this.createComment(commentJson["content"], false);
                if (replyingTo == null) {
                    // we're toplevel, don't want to replace
                    this.listElement.prepend(comment);
                } else {
                    this.lastCommentBar = null;
                    outer.replaceWith(comment);
                }
                // i don't know which one of these work so take them all :)
                input.innerHTML = ""
                input.innerText = ""
                input.value = ""
            })

            outer.hideParents = hideParents;

            if(replyingTo != null) {
                if(this.lastCommentBar != null) {
                    this.lastCommentBar.hideParents();
                    this.lastCommentBar.remove();
                }
                this.lastCommentBar = outer;
            }
        }
        return outer;
    }

    createComment(comment, toplevel = true) {
        var commentOuter = Div("div", "comment-" + (toplevel ? "outer" : "reply"));

        const outerContainer = Div("div", "comment");

        var commentContainer = Div("div", "comment-inner");
        var replyContainer = Div("div", "comment-replies");

        var replyInputContainer = Div("div", "comment-reply-input");


        var recalcReplyHeight = () => {
            var height = 0;
            for(var child of replyContainer.children) {
                let childHeight = child.getBoundingClientRect().height;
                console.log(`Child height: ${childHeight}`);
                height += childHeight;
            }
            console.log(`Total height: ${height}`);
            replyContainer.style.setProperty("--reply-height", height + "px");
        }





        var name = Div("div", "name");
        name.appendChild(Image("https://a.ppy.sh/" + comment.User_ID));
        name.appendChild(Text("h1", comment.Username));
        name.appendChild(Text("h3", timeAgo.format(new Date(comment.Date))));

        var content = Div("div", "content");
        content.innerHTML = bbCodeParser.parse(comment.Text);

        outerContainer.appendChild(name);
        outerContainer.appendChild(content);

        var toolbar = Div("div", "toolbar");



        var upvote = Text("button", "");
        upvote.prepend(LucideIcon("thumbs-up"));
        toolbar.appendChild(upvote);

        var upvote_count = Text("p", comment.VoteCount);
        upvote.appendChild(upvote_count);

        if(comment.HasVoted === 1) upvote.classList.add("active");


        var replies_opened = false;

        var reply = Text("button", "Reply");
        reply.prepend(LucideIcon("reply"));
        toolbar.appendChild(reply);

        if(loggedIn) {
            upvote.addEventListener("click", async () => {
                upvote.classList.add("loading");
                var data = await DoRequest("POST", "/api/vote/Common_Comments/" + comment.ID)
                if(data.message === "vote_add") {
                    upvote.classList.add("active");
                    comment.VoteCount++;
                } else if(data.message === "vote_remove") {
                    upvote.classList.remove("active");
                    comment.VoteCount--;
                }
                upvote_count.innerText = comment.VoteCount;
                upvote.classList.remove("loading");
            })


            reply.addEventListener("click", () => {
                if(replyContainer.querySelector(".comment-input") == null) {
                    replyContainer.prepend(this.commentBar(comment, () => {
                        if(replies_opened === false) {
                            commentOuter.classList.remove("replies-opened")
                        }
                    }));
                    commentOuter.classList.add("replies-opened");
                    recalcReplyHeight();
                } else {
                    if(replies_opened === false) {
                        commentOuter.classList.remove("replies-opened")
                    }
                    replyContainer.querySelector(".comment-input").remove();
                    recalcReplyHeight();
                }
            })
        }
        if(!loggedIn) {
            upvote.classList.add("disabled");
            reply.classList.add("disabled");
        }

        if (toplevel && comment.Replies>0) {
            var viewReplies = Div("button", "view-replies");
            viewReplies.innerText = comment.Replies + " Replies";
            viewReplies.prepend(LucideIcon("chevron-down"));
            toolbar.appendChild(viewReplies);
            viewReplies.classList.add("right");
        }




        outerContainer.appendChild(toolbar);
        outerContainer.appendChild(replyInputContainer);
        outerContainer.appendChild(replyContainer);

        if (toplevel && comment.Replies>0) {
            viewReplies.addEventListener("click", async () => {
                if(!replies_opened) {
                    var replies = (await DoRequest("POST", `/api/comments/${this.section}/${this.ref}/get`, {
                        "ParentID": comment.ID
                    }))["content"];
                    for (let reply of replies) {
                        replyContainer.appendChild(this.createComment(reply, false))
                    }
                    replies_opened = true;
                    recalcReplyHeight();
                    commentOuter.classList.add("replies-opened");
                } else {
                    commentOuter.classList.toggle("replies-opened");
                }
            })
        }

        commentOuter.appendChild(outerContainer);
        return commentOuter;
    }



    async loadComments(ref) {
        this.ref = ref;
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