import {DoRequest} from "../../utils/requests";
import {D2} from "../../utils/d2";
import {PushToast} from "../../ui/toasts";

const MAX_LENGTH = 10000;

export default class Bio {
    main;
    constructor(main) {
        this.main = main;
        this.init();
    }

    els = {};

    init() {
        this.els.panel = document.querySelector("[pr-el=panel-bio]");
        this.els.content = document.querySelector("[pr-el=bio-content]");
        this.els.edit = document.querySelector("[pr-el=bio-edit]");
        this.els.editor = document.querySelector("[pr-el=bio-editor]");

        // nothing to show someone else
        if (!this.main.Am_User() && !this.main.profile.Bio) {
            this.els.panel.style.display = "none";
            return;
        }

        this.showBio(this.main.profile.Bio_Html);

        if (this.main.Am_User()) {
            this.els.edit.classList.remove("hidden");
            this.els.edit.addEventListener("click", () => {
                this.openEditor();
            });
        }
    }

    showBio(html) {
        this.els.content.innerHTML = html;

        // user links leave the site and don't pass on any ranking
        for (let link of this.els.content.querySelectorAll("a")) {
            link.target = "_blank";
            link.rel = "nofollow noopener ugc";
        }

        if (!html) {
            let empty = document.createElement("p");
            empty.className = "bio-empty";
            empty.innerText = "You haven't written a bio yet, hit edit to add one!";
            this.els.content.appendChild(empty);
        }
    }

    openEditor() {
        this.els.content.classList.add("hidden");
        this.els.edit.classList.add("hidden");
        this.els.editor.classList.remove("hidden");
        this.els.editor.innerHTML = "";

        let field;
        let counter;
        let save;
        D2._currentParent = this.els.editor;
        field = document.createElement("advanced-text-field-v2");
        field.setAttribute("height", "400px");
        this.els.editor.appendChild(field);
        field.setContent(this.main.profile.Bio);

        D2.Div("bio-editor-footer", () => {
            counter = D2.Text("p", "");
            counter.classList.add("bio-counter");
            D2.Div("bio-editor-buttons", () => {
                let cancel = D2.Button("Cancel", "", () => {
                    this.closeEditor();
                });
                cancel.classList.add("pill-button");
                save = D2.Button("Save", "cta", async () => {
                    let text = field.getContent();
                    if (text.length > MAX_LENGTH) {
                        PushToast({"theme": "error", "content": "Your bio can be at most " + MAX_LENGTH + " characters"});
                        return;
                    }

                    save.classList.add("loading");
                    let response = await DoRequest("POST", "/api/profiles/bio", {"bio": text});
                    save.classList.remove("loading");

                    if (response.success !== true) {
                        PushToast({"theme": "error", "content": response.message});
                        return;
                    }

                    this.main.profile.Bio = response.content.Bio;
                    this.main.profile.Bio_Html = response.content.Bio_Html;
                    this.showBio(response.content.Bio_Html);
                    this.closeEditor();
                });
                save.classList.add("pill-button");
            });
        });

        // the editor has no change event we can lean on, so poll while it's open
        let update = () => {
            if (!this.els.editor.contains(counter)) return;
            let length = field.getContent().length;
            counter.innerText = length + " / " + MAX_LENGTH;
            counter.classList.toggle("over", length > MAX_LENGTH);
            setTimeout(update, 500);
        };
        update();
    }

    closeEditor() {
        this.els.editor.classList.add("hidden");
        this.els.editor.innerHTML = "";
        this.els.content.classList.remove("hidden");
        this.els.edit.classList.remove("hidden");
        this.els.panel.style.display = "";
    }
}
