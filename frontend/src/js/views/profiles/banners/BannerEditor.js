import {DoRequest, DoRequestWithLoader} from "../../../utils/requests";
import {PushToast} from "../../../ui/toasts";
import {D2} from "../../../utils/d2";
import {Modal, ModalButton, ModalIcon} from "../../../ui/overlay";
import {Enum} from "./inputs/enum";
import {Range} from "./inputs/range";
import {ColorHue} from "./inputs/color-hue";
import {ColourPicker} from "./inputs/colour-picker";
import {ColourGradient} from "./inputs/colour-gradient";

// ported from anthera's me_edit (MeEdit + Themes.InitializeThemeInputs)
export class BannerEditor {
    static inputTypes = {
        "enum": Enum,
        "range": Range,
        "color-hue": ColorHue,
        "colour-picker": ColourPicker,
        "colour-gradient": ColourGradient,
    };

    banner;
    iframe;
    changesMade = false;
    inputs = [];
    els = {};

    // banner is a row from /api/profiles/{id}/banners/all
    constructor(banner, previewEl, editorEl, callbacks = {}) {
        this.banner = banner;
        this.callbacks = callbacks;

        previewEl.innerHTML = "";
        editorEl.innerHTML = "";

        this.els.previewOuter = D2.Div("banner-preview-frame", () => {
        });
        this.SetPreviewAspect(banner.Theme.Resolution);
        this.iframe = document.createElement("iframe");
        this.els.previewOuter.appendChild(this.iframe);
        previewEl.appendChild(this.els.previewOuter);

        let editor = D2.Div("panel banner-editor-inner", () => {
            D2.Div("banner-editor-header", () => {
                D2.Div("input-with-text slide", () => {
                    D2.Text("p", "Name");
                    this.els.name = D2.Input(" ", "text", banner.Name);
                });
                // looks like a dropdown, opens the theme picker
                this.els.theme = D2.Custom("button", "input-with-text slide banner-theme-select", () => {
                    D2.Text("p", "Theme");
                    D2.Div("banner-theme-select-inner", () => {
                        this.els.themeName = D2.Text("span", banner.Theme.Name);
                        D2.LucideIcon("chevron-down");
                    });
                });
                // which mode the banner shows stats for
                this.els.gamemode = document.createElement("gamemode-selector");
                this.els.gamemode.value = banner.Gamemode || "osu";
                this.els.gamemode.addEventListener("change", (e) => {
                    this.banner.Gamemode = e.detail;
                    this.SetChangesMade();
                    this.UpdatePreview(true);
                });
                D2._currentParent.appendChild(this.els.gamemode);
                this.els.theme.addEventListener("click", () => {
                    if (!this.callbacks.pickTheme) return;
                    this.callbacks.pickTheme((theme) => {
                        this.SwitchTheme(theme);
                    });
                });
            });
            this.els.inputArea = D2.Div("banner-editor-inputs", () => {
            });
            D2.Div("banner-editor-buttons", () => {
                this.els.save = D2.Button("Save", "primary", () => {
                    this.Save(true);
                });
                // fills the gap between the other buttons and delete
                this.els.linkBox = this.RenderLinkBox();
                this.els.delete = D2.Button("Delete", "danger", () => {
                    this.Delete();
                });
            });
        });
        editorEl.appendChild(editor);

        this.els.name.addEventListener("input", () => {
            this.banner.Name = this.els.name.value;
            this.SetChangesMade();
        });

        this.InitializeThemeInputs();
        this.UpdatePreview(true);
    }

    // raw / markdown / bbcode picker with the link itself and a copy button
    RenderLinkBox() {
        let formats = [
            {"Key": "bbcode", "Name": "BBCode (osu!)"},
            {"Key": "markdown", "Name": "Markdown"},
            {"Key": "raw", "Name": "Raw Link"},
        ];
        let current = "bbcode";
        let buttons = [];
        let text = null;

        let update = () => {
            text.value = this.GetLinkAs(current);
            for (let button of buttons) {
                button.classList.toggle("active", button.formatKey == current);
            }
        };

        let el = D2.Div("banner-link-box", () => {
            D2.Div("banner-link-formats", () => {
                for (let format of formats) {
                    let button = D2.Custom("button", "banner-link-format", () => {
                        D2.Text("p", format.Name);
                    });
                    button.formatKey = format.Key;
                    button.addEventListener("click", () => {
                        current = format.Key;
                        update();
                    });
                    buttons.push(button);
                }
            });
            text = D2.Input("", "text", "");
            text.readOnly = true;
            text.classList.add("banner-link-text");
            text.addEventListener("focus", () => {
                text.select();
            });

            let copy = D2.IconButton("clipboard", "", "banner-link-copy");
            copy.setAttribute("tooltip", "Copy");
            copy.addEventListener("click", () => {
                navigator.clipboard.writeText(text.value);
                PushToast({"theme": "success", "content": "Copied banner link!", time: 3});
            });
        });

        update();
        return el;
    }

    GetLinkAs(format) {
        let image = this.GetLink();
        let profile = location.origin + "/profiles/" + this.banner.User_ID;

        if (format == "bbcode") return "[url=" + profile + "][img]" + image + "[/img][/url]";
        if (format == "markdown") return "[![" + this.banner.Name + "](" + image + ")](" + profile + ")";
        return image;
    }

    GetLink() {
        return "https://banners.osekai.net/" + this.banner.User_ID + "/" + this.banner.ID + ".png";
    }

    SetChangesMade(value = true) {
        this.changesMade = value;
        // save lights up when there's something to save
        this.els.save.classList.toggle("cta", value);
    }

    // saved settings with the theme defaults filled in, so the banner can rebuild every var
    GetEffectiveSettings() {
        let settings = {};
        for (let key in this.banner.Theme.Settings) {
            settings[key] = this.banner.Theme.Settings[key].default;
            if (typeof (this.banner.Settings[key]) !== "undefined") {
                settings[key] = this.banner.Settings[key];
            }
        }
        return settings;
    }

    UpdatePreview(needsUpdate = false) {
        if (needsUpdate) {
            const oldIframe = this.iframe;
            oldIframe.classList.add("stale");
            const newIframe = document.createElement("iframe");

            // site will only accept last 10 seconds
            let tmp = {
                "Settings": this.banner.Settings,
                "Gamemode": this.banner.Gamemode || "",
                "time": Date.now(),
            };
            newIframe.src = "/profiles/banner/preview/" + this.banner.Theme_Key + "?override=" + encodeURIComponent(btoa(encodeURIComponent(JSON.stringify(tmp))));

            oldIframe.parentElement.appendChild(newIframe);
            this.iframe = newIframe;
            // old one stays up until the new one is fully ready
            BannerEditor.TrackLoad(newIframe, oldIframe.parentElement).then(() => {
                oldIframe.remove();
                this.UpdatePreview();
            });

        } else {
            if (!this.iframe.contentWindow) return;
            this.iframe.contentWindow.postMessage({
                "message": "banner.update",
                "content": {
                    "settings": this.GetEffectiveSettings(),
                    "theme": this.banner.Theme
                }
            }, location.origin);
        }
    }

    // showOn: {"otherKey": "value"} only shows the input when the other setting matches
    UpdateVisibility() {
        let settings = this.GetEffectiveSettings();
        for (let input of this.inputs) {
            let visible = true;
            if (input.data.showOn) {
                for (let key in input.data.showOn) {
                    if (settings[key] !== input.data.showOn[key]) visible = false;
                }
            }
            input.el.classList.toggle("hidden", !visible);
        }
    }

    // same as anthera's themeinfo-apply, but drops settings the new theme doesn't have
    SwitchTheme(theme) {
        if (theme.Key === this.banner.Theme_Key) return;

        let settings = {};
        for (let key in this.banner.Settings) {
            if (typeof (theme.Settings[key]) !== "undefined") {
                settings[key] = this.banner.Settings[key];
            }
        }

        this.banner.Theme_Key = theme.Key;
        this.banner.Theme = theme;
        this.banner.Settings = settings;
        this.els.themeName.innerText = theme.Name;

        this.SetPreviewAspect(theme.Resolution);
        this.InitializeThemeInputs();
        this.UpdatePreview(true);
        this.SetChangesMade();
    }

    // resolution is "w:h", the css needs the numbers separate to cap the height
    SetPreviewAspect(resolution) {
        BannerEditor.SetAspect(this.els.previewOuter, resolution);
    }

    // shows a loader over the frame until the page, styles and fonts are all in
    static TrackLoad(iframe, outer) {
        let overlay = document.createElement("div");
        overlay.className = "banner-frame-loader";
        overlay.innerHTML = loaderSmall;
        outer.appendChild(overlay);
        iframe.classList.add("loading");

        return new Promise((resolve) => {
            let done = () => {
                window.removeEventListener("message", onMessage);
                clearTimeout(timeout);
                iframe.classList.remove("loading");
                // fades out with the banner fading in
                overlay.classList.add("done");
                setTimeout(() => overlay.remove(), 250);
                resolve();
            };
            // the banner posts this once it's drawn, fonts and all
            let onMessage = (e) => {
                if (e.origin !== location.origin) return;
                if (!e.data || e.data.message !== "banner.ready") return;
                if (e.source !== iframe.contentWindow) return;
                done();
            };
            window.addEventListener("message", onMessage);
            // don't spin forever if it never reports
            let timeout = setTimeout(done, 10000);
        });
    }

    // also used by the banner list
    static SetAspect(el, resolution) {
        let [w, h] = resolution.split(":");
        el.style.setProperty("--aspect", w + "/" + h);
        el.style.setProperty("--aspect-w", w);
        el.style.setProperty("--aspect-h", h);
    }

    InitializeThemeInputs() {
        const area = this.els.inputArea;
        area.innerHTML = "";
        this.inputs = [];

        for (let value in this.banner.Theme.Settings) {
            // copy so we don't overwrite the theme's real default
            const data = {...this.banner.Theme.Settings[value]};

            for (let uv_key in this.banner.Settings) {
                if (uv_key === value) {
                    data.default = this.banner.Settings[uv_key];
                }
            }

            if (typeof (BannerEditor.inputTypes[data['type']]) === "undefined") {
                console.warn("no banner input for type " + data['type']);
                continue;
            }

            const input = new BannerEditor.inputTypes[data['type']](data, (val) => {
                this.SetChangesMade();
                this.banner.Settings[value] = val;
                this.UpdateVisibility();
                // enums can change classes so they need a full reload, everything else
                // fires continuously while dragging so it gets the lightweight postMessage update
                this.UpdatePreview(data.type === "enum");
            });
            this.inputs.push({"el": input.el, "data": data});
            area.appendChild(input.el);
        }

        this.UpdateVisibility();
    }

    async Save(report = false) {
        let resp = await DoRequestWithLoader("POST", "/api/profiles/banners/" + this.banner.ID + "/save", {
            "data": JSON.stringify({
                "Name": this.banner.Name,
                "Theme_Key": this.banner.Theme_Key,
                "Settings": this.banner.Settings,
                "Gamemode": this.banner.Gamemode || "",
            })
        }, "Saving changes!");

        if (resp.success !== true) {
            PushToast({"theme": "error", "content": resp.message});
            return;
        }

        this.SetChangesMade(false); // saved. dont need to shout a user

        if (report) PushToast({
            "theme": "success", "content": "Saved your banner!", buttons: {
                "Copy Link": () => {
                    navigator.clipboard.writeText(this.GetLink());
                }
            },
            time: 5
        })

        if (this.callbacks.saved) this.callbacks.saved(this.banner);
    }

    Delete() {
        let modal = new Modal("Delete this banner?", this.banner.Name + " will be gone for good, and any links to it will stop working.", [
            new ModalButton("Delete", async () => {
                modal.close();
                await this.DeleteConfirmed();
            }),
            new ModalButton("Cancel", () => {
                modal.close();
            })
        ], new ModalIcon("alert-triangle", "#ff623e"));
    }

    async DeleteConfirmed() {
        let resp = await DoRequest("POST", "/api/profiles/banners/" + this.banner.ID + "/delete");
        if (resp.success !== true) {
            PushToast({"theme": "error", "content": resp.message});
            return;
        }

        this.SetChangesMade(false);
        if (this.callbacks.deleted) this.callbacks.deleted(this.banner);
    }
}
