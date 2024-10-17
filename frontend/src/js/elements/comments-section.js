import '../../css/elements/comments-section.css'

import {DoRequest} from "../utils/requests";
import {Button, Div, LucideIcon, Text, Image, RoleBadge} from "../utils/dom";
import {timeAgo} from "../utils/timeago";
import bbCodeParser from 'js-bbcode-parser';
import {createDropdown} from "../ui/ultra-dropdown";
import {reportOverlay} from "../ui/reportOverlay";
import {PushToast} from "../ui/toasts";
import {LoaderOverlay} from "../ui/loader-overlay";
import {PermissionChecker} from "../utils/permissionChecker";
import {Modal, ModalButton, ModalIcon} from "../ui/overlay";
import {CommaSeparatedRolesToRoleArray} from "../utils/groups";
import {makeLinksClickable} from "../utils/makeLinksClickable";
import {CenteredLoader} from "../utils/loaderUtils";

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

        if(comment.Roles != null) {
            var groupsDiv = Div("div", "groups");
            var groups = CommaSeparatedRolesToRoleArray(comment.Roles);
            for (var group of groups) {
                groupsDiv.append(RoleBadge(group));
            }
            name.appendChild(groupsDiv);
        }

        name.appendChild(Text("h3", timeAgo.format(new Date(comment.Date))));

        var content = Div("div", "content");
        content.innerHTML = bbCodeParser.parse(comment.Text);
        makeLinksClickable(content);

        commentContainer.appendChild(name);
        commentContainer.appendChild(content);

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

        var extrabutton = Div("button", "")
        toolbar.appendChild(extrabutton);
        extrabutton.appendChild(LucideIcon("ellipsis"));


        var extrabutton_dropdown = Div("div", "dropdown-content");
        commentOuter.appendChild(extrabutton_dropdown);

        createDropdown(extrabutton, extrabutton_dropdown, "bottomleft");

        var report = Button("Report", "icon-button");
        extrabutton_dropdown.appendChild(report);
        report.prepend(LucideIcon("triangle-alert"));
        report.addEventListener("click", () => {
            reportOverlay("Report " + comment.Username + "'s comment", async (value) => {
                await DoRequest("POST", `/api/comments/${comment.ID}/report`, {
                    // @ts-ignore
                    "reporter_name": userData.username,
                    // @ts-ignore
                    "reporter_id": userData.id,
                    "reason": value,
                    "url": location.href
                })
                PushToast({
                    "theme": "success",
                    content: "Thanks for the report! We'll look into it soon!"
                })
            })
        })


        var del = async (admin = false) => {
            var modal = new Modal("Are you sure you want to delete this post?", "This cannot be undone!", [new ModalButton("Delete", async () => {
                var url  = `/api/comments/${comment.ID}/` + (admin == true ? "admindelete" : "delete");
                var loader = new LoaderOverlay("Deleting");
                var r = await DoRequest('POST', url);
                loader.overlay.remove();
                if (r.success) {
                    commentOuter.remove();
                } else {
                    PushToast({
                        theme: "error",
                        content: r.message
                    })
                }
                modal.overlay.remove();
            }), new ModalButton("Cancel", () => {
                modal.close();
            })], new ModalIcon("alert-triangle", "#ff623e"));
        }

        if(PermissionChecker("comments.pin")) {
            var adm_pin = Button("AdminPin", "cta icon-button");

            extrabutton_dropdown.appendChild(adm_pin);
            adm_pin.prepend(LucideIcon("pin"));
            adm_pin.addEventListener("click", async () => {
                await DoRequest(`/api/comments/${comment.ID}/pin`);
                this.loadComments(this.ref);
            });
        }

        if(loggedIn && comment.User_ID === userData.id) {
            var _delete = Button("Delete", "warning icon-button");
            extrabutton_dropdown.appendChild(_delete);
            _delete.prepend(LucideIcon("trash"));
            _delete.addEventListener("click", async () => {
                await del();
            });
        }

        if(PermissionChecker("comments.delete.any")) {
            var adm_delete = Button("AdminDelete", "warning icon-button");

            extrabutton_dropdown.appendChild(adm_delete);
            adm_delete.prepend(LucideIcon("zap"));
            adm_delete.addEventListener("click", async () => {
                await del(true);
            });
        }




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


        if(comment.Is_Pinned == 1) {
            commentContainer.classList.add("pinned");
            var pin = Div("div", "pin");
            pin.appendChild(LucideIcon("pin"));
            pin.setAttribute("tooltip", "Pinned Comment")
            name.appendChild(pin)
        }

        commentContainer.appendChild(toolbar);


        outerContainer.appendChild(commentContainer);
        outerContainer.appendChild(replyInputContainer);
        outerContainer.appendChild(replyContainer);

        if (toplevel && comment.Replies>0) {
            viewReplies.addEventListener("click", async () => {
                if(!replies_opened) {
                    viewReplies.classList.add("loading");
                    var replies = (await DoRequest("POST", `/api/comments/${this.section}/${this.ref}/get`, {
                        "ParentID": comment.ID
                    }))["content"];
                    for (let reply of replies) {
                        replyContainer.appendChild(this.createComment(reply, false))
                    }
                    replies_opened = true;
                    recalcReplyHeight();
                    commentOuter.classList.add("replies-opened");
                    viewReplies.classList.remove("loading");
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
        this.listElement.innerHTML = "";
        this.listElement.appendChild(CenteredLoader());

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