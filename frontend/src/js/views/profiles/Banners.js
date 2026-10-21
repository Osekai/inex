import {DoRequest} from "../../utils/requests";
import {D2} from "../../utils/d2";
import {Modal, ModalButton, ModalIcon, Overlay} from "../../ui/overlay";
import {PushToast} from "../../ui/toasts";
import {BannerEditor} from "./banners/BannerEditor";

export default class Banners {
    main;
    constructor(main) {
        this.main = main;
        this.init()
    }

    el = null;
    els = [];

    userBanners;
    availableThemes;
    editor = null;

    async init() {
        if (!this.main.Am_User()) {
            this.hide();
            return;
        }

        this.el = D2.Div("banner-editor", () => {
            this.els.list = D2.Div("banner-list", () => {

            });
            // mobile only, goes back to the list
            this.els.back = D2.Button("Back to banners", "", () => {
                this.el.classList.remove("editing");
            });
            this.els.back.classList.add("banner-back");
            // preview and editor scroll along with you as one block
            this.els.side = D2.Div("banner-side", () => {
                this.els.preview = D2.Div("banner-preview", () => {

                });
                this.els.editor = D2.Div("banner-editor", () => {

                })
            });
        })

        let availableThemes = await DoRequest("GET", "/api/profiles/banners/themes");
        this.availableThemes = availableThemes['content'];

        await this.loadList();

        document.getElementById("banners-outer").appendChild(this.el);
    }

    // banners are only for the profile owner, so nobody else gets the tab
    hide() {
        let page = document.getElementById("banners-outer");
        let button = document.querySelector("[otab-button=banners]");

        // came in through a ?page=banners link
        let wasOpen = !page.classList.contains("otab-hidden");

        page.remove();
        button.remove();

        if (wasOpen) {
            document.getElementById("profile-outer").switch("profile");
        }
    }

    async loadList(openId = null) {
        let userBanners = await DoRequest("POST", "/api/profiles/" + this.main.profile.User.id + "/banners/all");
        this.userBanners = userBanners['content'];

        this.els.list.innerHTML = "";

        for(let banner of this.userBanners) {
            let iframeOuter;
            let el = D2.Custom("button", "banner-list-item", () => {
                iframeOuter = D2.Div("banner-list-item-shadow", () => {})
                D2.Div("banner-list-item-metadata", () => {
                    D2.Text("h1", banner.Name)
                    D2.Text("h3", "using theme " + banner.Theme.Name)
                })
            })
            let iframe = document.createElement("iframe");
            iframe.src = "/profiles/banner/" + banner.ID + "/html";
            iframe.setAttribute("loading", "lazy");

            BannerEditor.SetAspect(iframeOuter, banner.Theme.Resolution);

            el.dataset.id = banner.ID;
            if (this.editor && this.editor.banner.ID == banner.ID) el.classList.add("selected");

            el.addEventListener("click", () => {
                this.openEditor(banner);
            })

            iframeOuter.appendChild(iframe);
            BannerEditor.TrackLoad(iframe, iframeOuter);
            this.els.list.appendChild(el);

            if (openId !== null && banner.ID == openId) this.openEditor(banner);
        }

        if (this.main.Am_User()) {
            let create = D2.Button("Create Banner", "primary", () => {
                this.openCreate();
            });
            this.els.list.appendChild(create);
        }
    }

    openEditor(banner) {
        if (!this.main.Am_User()) return;

        if (this.editor && this.editor.changesMade) {
            let modal = new Modal("Discard your changes?", "You have unsaved changes on " + this.editor.banner.Name + ", opening another banner will lose them.", [
                new ModalButton("Discard", () => {
                    modal.close();
                    this.editor.SetChangesMade(false);
                    this.openEditor(banner);
                }),
                new ModalButton("Cancel", () => {
                    modal.close();
                })
            ], new ModalIcon("alert-triangle", "#ff623e"));
            return;
        }

        // copy so discarded changes don't stick around on the list's data
        let copy = JSON.parse(JSON.stringify(banner));
        // banners without a mode yet start on the mode of the profile being viewed
        if (!copy.Gamemode) copy.Gamemode = this.main.gamemode;
        this.editor = new BannerEditor(copy, this.els.preview, this.els.editor, {
            pickTheme: (cb) => {
                this.openThemePicker("Change theme", cb);
            },
            saved: () => {
                this.loadList();
            },
            deleted: () => {
                this.editor = null;
                this.els.preview.innerHTML = "";
                this.els.editor.innerHTML = "";
                this.el.classList.remove("editing");
                this.loadList();
            }
        });
        this.markSelected(banner.ID);
        this.el.classList.add("editing");
    }

    markSelected(id) {
        for (let item of this.els.list.querySelectorAll(".banner-list-item")) {
            item.classList.toggle("selected", item.dataset.id == id);
        }
    }

    openCreate() {
        this.openThemePicker("Create a banner", async (theme) => {
            let resp = await DoRequest("POST", "/api/profiles/banners/create", {"theme": theme.Key});
            if (resp.success !== true) {
                PushToast({"theme": "error", "content": resp.message});
                return;
            }
            await this.loadList(resp.content.ID);
        });
    }

    // grid of every theme, cb gets the picked theme
    openThemePicker(title, cb) {
        let overlay = null;

        let inner = D2.Div("panel banner-create", () => {
            D2.Text("h1", title);
            D2.Div("divider", () => {
            });
            D2.Div("banner-create-grid", () => {
                for (let theme of this.availableThemes) {
                    let iframeOuter;
                    let button = D2.Custom("button", "banner-create-theme", () => {
                        iframeOuter = D2.Div("banner-list-item-shadow", () => {
                        });
                        D2.Div("banner-list-item-metadata", () => {
                            D2.Text("h1", theme.Name);
                            D2.Text("h3", theme.Category);
                        });
                    });

                    let iframe = document.createElement("iframe");
                    iframe.src = "/profiles/banner/preview/" + theme.Key;
                    iframe.setAttribute("loading", "lazy");
                    BannerEditor.SetAspect(iframeOuter, theme.Resolution);
                    iframeOuter.appendChild(iframe);
                    BannerEditor.TrackLoad(iframe, iframeOuter);

                    button.addEventListener("click", () => {
                        overlay.remove();
                        cb(theme);
                    });
                }
            });
        });

        overlay = new Overlay(inner);
    }
}
