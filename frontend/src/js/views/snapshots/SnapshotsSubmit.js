import {D2} from "../../utils/d2";
import {Overlay} from "../../ui/overlay";
import {DoRequestWithLoader} from "../../utils/requests";
import {PushToast} from "../../ui/toasts";

export class SnapshotsSubmit {
    static Field(label, build) {
        return D2.Div("input-with-text slide", () => {
            D2.Text("p", label);
            build();
        });
    }

    static Open() {
        let overlay;
        let title, link, description;

        let modal = D2.Div("basic-modal snapshots-submit-modal", () => {
            D2.LucideIcon("upload");
            D2.Text("h1", "Submit a version");
            D2.Text("p", "Got an osu! version we don't have yet? Send us a link and we'll take a look. Please include as much info as you can about where it's from!", "info");

            D2.Div("form", () => {
                this.Field("Version (e.g. b20140127)", () => {
                    title = D2.Input("", "text");
                });
                this.Field("Download link", () => {
                    link = D2.Input("", "text");
                });
                this.Field("Anything else we should know? (optional)", () => {
                    description = D2.TextArea("", 4);
                });
            });

            D2.Div("buttons", () => {
                let submit = D2.Text("button", "Submit", "lumen-button");
                submit.addEventListener("click", async () => {
                    let resp = await DoRequestWithLoader("POST", "/api/snapshots/submit", {
                        "title": title.value,
                        "link": link.value,
                        "description": description.value,
                    }, "Submitting");
                    if (!resp.success) {
                        PushToast({theme: "error", content: resp.message});
                        return;
                    }
                    overlay.remove();
                    PushToast({theme: "success", content: "Thanks! We'll take a look soon."});
                });

                let cancel = D2.Text("button", "Cancel", "lumen-button border");
                cancel.addEventListener("click", () => overlay.remove());
            });
        });

        overlay = new Overlay(modal);
        // don't lose what they typed to a stray click
        overlay.allowclickoff = false;
    }
}
