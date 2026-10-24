import {ArchiveData} from "./ArchiveData";
import {D2} from "../../utils/d2";
import {DoRequest, DoRequestWithFile, DoRequestWithLoader} from "../../utils/requests";
import {PermissionChecker} from "../../utils/permissionChecker";
import {PushToast} from "../../ui/toasts";
import {Modal, ModalButton, ModalIcon, Overlay} from "../../ui/overlay";
import {LoaderOverlay} from "../../ui/loader-overlay";
import "../../elements/searchable-dropdown";
import {ArchiveOCR} from "./ArchiveOCR";
import {ArchiveUI} from "./ArchiveUI";
import {InputTextarea} from "../../utils/dom";
import {getParam, removeParam} from "../../utils/urlQuery";

export class ArchiveEditor {
    static GameScreens = null;
    static LegacyFile = null;
    // archive.js hooks in here to re-render everything else
    static OnChanged = null;
    static OnDeleted = null;

    static async Load(full) {
        if (document.getElementById("editor") == null) return;

        // only passed once, straight after a migration
        if (getParam("legacy_file") != null) {
            this.LegacyFile = {"ID": full.ID, "URL": getParam("legacy_file")};
            removeParam("legacy_file");
        }

        if (this.GameScreens == null) {
            this.GameScreens = (await DoRequest("GET", "/api/archive/screenshots/gamescreens"))['content'];
        }

        this.Render(full);
    }

    // panel is which editor panel to redraw, null redraws nothing (the input already shows the change)
    static async Changed(resp, panel = null) {
        if (!resp.success) {
            PushToast({theme: "error", content: resp.message});
            return false;
        }
        await ArchiveData.Refresh(resp.content);
        if (panel != null) this.RenderPanel(panel, resp.content);
        if (this.OnChanged != null) this.OnChanged(resp.content);
        return true;
    }

    static panels = {};

    static RenderPanel(name, full) {
        let old = this.panels[name];
        if (old == null) return;

        let fresh = null;
        if (name == "status") fresh = this.RenderStatus(full);
        if (name == "details") fresh = this.RenderDetails(full);
        if (name == "changelog") fresh = this.RenderChangelog(full);
        if (name == "file") fresh = this.RenderFile(full);
        if (name == "screenshots") fresh = this.RenderScreenshots(full);
        if (name == "mirrors") fresh = this.RenderMirrors(full);

        old.replaceWith(fresh);
        this.panels[name] = fresh;
    }

    // same slide inputs as the bug reporter, the placeholder has to stay empty for the label to slide
    static Field(label, build) {
        return D2.Div("input-with-text slide", () => {
            D2.Text("p", label);
            build();
        });
    }

    // searchable-dropdown wrapper, .value works like a select's
    static Dropdown(options, value, searchable = false, onChange = null) {
        let dropdown = document.createElement("searchable-dropdown");
        dropdown.searchable = searchable;

        let index = 0;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value == value) index = i;
        }
        dropdown.value = options[index]?.value ?? "";

        dropdown.create(options, "name", index, null, (item) => {
            // create() fires this for the default too, same check as the banner enum input
            if (item.value == dropdown.value) return;
            dropdown.value = item.value;
            if (onChange != null) onChange(item.value);
        });
        // create always shows the first item, show the real selection
        dropdown.querySelector(".dropdown").innerText = options[index]?.name ?? "";

        if (D2._currentParent) D2._currentParent.appendChild(dropdown);
        return dropdown;
    }

    static DragArea(multiple, build = null) {
        let area = D2.Custom("image-drag-area", "");
        area.setAttribute("preview", "false");
        area.setAttribute("drag-when-set", "");
        if (multiple) {
            area.allowMultiple = true;
            area.maxFiles = 50;
        }
        // own ui instead of the image one
        if (build != null) {
            area.setAttribute("generate_ui", "false");
            D2._appendChildren(area, build);
        }
        return area;
    }

    static GameScreenOptions() {
        let screens = [{"name": "Not set", "value": ""}];
        for (let screen of this.GameScreens ?? []) {
            screens.push({"name": screen, "value": screen});
        }
        return screens;
    }

    // asks what each freshly uploaded screenshot is, one at a time
    static async AskGameScreens(screenshots) {
        for (let screenshot of screenshots) {
            let chosen = await new Promise((resolve) => {
                let overlay;
                let modal = D2.Div("basic-modal archive-gamescreen-modal", () => {
                    D2.Image("", screenshot.Thumb);
                    D2.Text("h1", "What's this screen?");
                    D2.Div("buttons", () => {
                        for (let screen of this.GameScreens ?? []) {
                            let button = D2.Text("button", screen, "lumen-button");
                            button.addEventListener("click", () => {
                                overlay.remove();
                                resolve(screen);
                            });
                        }
                        let skip = D2.Text("button", "Skip", "lumen-button border");
                        skip.addEventListener("click", () => {
                            overlay.remove();
                            resolve(null);
                        });
                    });
                });
                overlay = new Overlay(modal);
                overlay.allowclickoff = false;
            });

            if (chosen != null) {
                await DoRequest("POST", `/api/archive/screenshots/${screenshot.ID}/edit`, {"game_screen": chosen});
            }
        }
    }

    // same markup as the checkboxes in test.php
    static Checkbox(label, checked) {
        let id = "archive-checkbox-" + Math.random().toString(36).slice(2);
        let input;
        D2.Div("toggle-text", () => {
            input = D2.CustomPlus("input", "checkbox", {"type": "checkbox", "id": id});
            input.checked = checked == 1;
            D2.CustomPlus("label", "", {"for": id}, label);
        });
        return input;
    }

    // header goes next to the title, top right like the medals beatmaps panel
    static Panel(title, build, header = null) {
        return D2.Div("panel", () => {
            D2.Div("panel-header", () => {
                D2.Text("h1", title);
                if (header != null) header();
            });
            D2.Div("divider");
            build();
        });
    }

    static Render(full) {
        let editor = document.getElementById("editor");
        editor.innerHTML = "";

        let left = D2.Div("main-left");
        let right = D2.Div("main-right");
        editor.appendChild(left);
        editor.appendChild(right);

        this.panels = {};
        // left: details + screenshots, right: status, file, mirrors
        if (PermissionChecker("snapshots.admin.version.edit")) this.panels.details = left.appendChild(this.RenderDetails(full));
        if (PermissionChecker("snapshots.admin.version.edit")) this.panels.changelog = left.appendChild(this.RenderChangelog(full));
        if (PermissionChecker("snapshots.admin.version.screenshots")) this.panels.screenshots = left.appendChild(this.RenderScreenshots(full));
        this.panels.status = right.appendChild(this.RenderStatus(full));
        if (PermissionChecker("snapshots.admin.version.upload")) this.panels.file = right.appendChild(this.RenderFile(full));
        if (PermissionChecker("snapshots.admin.version.edit")) this.panels.mirrors = right.appendChild(this.RenderMirrors(full));
    }

    static RenderStatus(full) {
        return this.Panel("Status", () => {
            if (full.Published == 1) {
                D2.Text("p", "This version is published and visible to everyone.");
            } else {
                D2.Text("p", "This version is unpublished, only admins can see it.");
            }

            if (this.LegacyFile != null && this.LegacyFile.ID == full.ID && full.File_Format == null) {
                D2.Div("archive-warning", () => {
                    D2.Div("archive-warning-header", () => {
                        D2.LucideIcon("alert-triangle");
                        D2.Text("h3", "This version wasn't a .zip on eclipse");
                    });
                    D2.Text("p", "It wasn't migrated. Download it, re-archive it as a .zip and upload it below.");
                    let link = D2.Link("Download from eclipse", "", this.LegacyFile.URL);
                    link.target = "_blank";
                });
            }

            D2.Div("archive-editor-buttons", () => {
                if (PermissionChecker("snapshots.admin.version.publish")) {
                    let text = "Publish";
                    if (full.Published == 1) text = "Unpublish";
                    let publish = D2.Text("button", text, "lumen-button");
                    publish.addEventListener("click", async () => {
                        let published = 1;
                        if (full.Published == 1) published = 0;
                        let resp = await DoRequestWithLoader("POST", `/api/archive/${full.ID}/publish`, {"published": published}, "Saving");
                        await this.Changed(resp, "status");
                    });
                }

                if (PermissionChecker("snapshots.admin.version.delete")) {
                    let del = D2.Text("button", "Delete", "lumen-button border");
                    del.addEventListener("click", () => {
                        let modal = new Modal("Delete " + full.Version + "?", "This removes the version, its screenshots and its file. This cannot be undone!", [
                            new ModalButton("Delete", async () => {
                                let resp = await DoRequestWithLoader("POST", `/api/archive/${full.ID}/delete`, {}, "Deleting");
                                modal.overlay.remove();
                                if (!resp.success) {
                                    PushToast({theme: "error", content: resp.message});
                                    return;
                                }
                                await ArchiveData.Refresh();
                                if (this.OnDeleted != null) this.OnDeleted();
                            }),
                            new ModalButton("Cancel", () => {
                                modal.close();
                            })
                        ], new ModalIcon("alert-triangle", "#ff623e"));
                    });
                }
            });
        });
    }

    static RenderDetails(full) {
        let inputs = {};
        let groups = ArchiveData.GetGroupsSync().map(group => ({"name": group.Group_Name, "value": group.ID}));

        return this.Panel("Details", () => {
            D2.Div("form", () => {
                // related inputs side by side, like the medal admin panel
                D2.Div("archive-editor-row", () => {
                    this.Field("Version", () => {
                        inputs.Version = D2.Input("", "text", full.Version);
                    });
                    this.Field("Release Date", () => {
                        inputs.Release_Date = D2.Input("", "date", full.Release_Date);
                    });
                });
                D2.Div("archive-editor-row", () => {
                    this.Field("Name", () => {
                        inputs.Meta_Name = D2.Input("", "text", full.Meta_Name ?? "");
                    });
                    this.Field("Group", () => {
                        inputs.Group_ID = this.Dropdown(groups, full.Group_ID);
                    });
                });
                D2.Div("archive-editor-row", () => {
                    this.Field("Archiver (osu! user ID)", () => {
                        inputs.Meta_Archiver_ID = D2.Input("", "number", full.Meta_Archiver_ID ?? "");
                    });
                    this.Field("Video (YouTube ID)", () => {
                        inputs.Meta_Video = D2.Input("", "text", full.Meta_Video ?? "");
                    });
                });

                // same code field as the medal solution editor, supports <solution-note> etc
                let description = InputTextarea("Description", "code", full.Meta_Description ?? "");
                description.element.classList.add("archive-editor-code");
                D2._currentParent.appendChild(description.element);
                inputs.Meta_Description = {
                    get value() {
                        return description.value();
                    }
                };
                // no ui for this anymore, extra info goes in the description as <solution-note extra>
                inputs.Meta_Extra_Info = {"value": full.Meta_Extra_Info ?? ""};

                D2.Div("archive-editor-row", () => {
                    inputs.Flag_Auto_Updates = this.Checkbox("Automatically updates", full.Flag_Auto_Updates);
                    inputs.Flag_Requires_Server = this.Checkbox("Requires a private server", full.Flag_Requires_Server);
                });
            });

            let save = D2.Text("button", "Save", "lumen-button");
            save.addEventListener("click", async () => {
                let data = {};
                for (let key in inputs) {
                    if (inputs[key].type == "checkbox") {
                        data[key] = 0;
                        if (inputs[key].checked) data[key] = 1;
                    } else {
                        data[key] = inputs[key].value;
                    }
                }
                let resp = await DoRequestWithLoader("POST", `/api/archive/${full.ID}/edit`, data, "Saving");
                if (await this.Changed(resp)) {
                    PushToast({theme: "success", content: "Saved!"});
                }
            });
        });
    }

    static RenderChangelog(full) {
        return this.Panel("Changelog", () => {
            D2.Div("form", () => {
                let link;
                this.Field("Link (osu! changelog page)", () => {
                    link = D2.Input("", "text", full.Meta_Changelog_Link ?? "");
                });

                let notes = InputTextarea("Notes", "code", full.Meta_Changelog_Notes ?? "");
                notes.element.classList.add("archive-editor-code");
                D2._currentParent.appendChild(notes.element);

                let save = D2.Text("button", "Save", "lumen-button");
                save.addEventListener("click", async () => {
                    let resp = await DoRequestWithLoader("POST", `/api/archive/${full.ID}/changelog`, {"Meta_Changelog_Notes": notes.value(), "Meta_Changelog_Link": link.value}, "Saving");
                    if (await this.Changed(resp)) {
                        PushToast({theme: "success", content: "Saved!"});
                    }
                });
            });
        });
    }

    static RenderFile(full) {
        return this.Panel("File", () => {
            // current file first, then the drop area to replace it
            if (full.Download != null) {
                ArchiveUI.DownloadCard(full);
            }

            let title, subtitle;
            let area = this.DragArea(false, () => {
                D2.Div("center archive-file-area", () => {
                    D2.LucideIcon("file-archive");
                    D2.Div("texts", () => {
                        if (full.File_Format != null) {
                            title = D2.Text("h1", full.Version + "." + full.File_Format);
                            subtitle = D2.Text("h2", "drop a .zip here to replace it");
                        } else {
                            title = D2.Text("h1", "No file yet");
                            subtitle = D2.Text("h2", "drag a .zip here or click to upload");
                        }
                    });
                });
            });
            // the drag area only takes images by default
            setTimeout(() => {
                let input = area.querySelector("input[type=file]");
                if (input != null) input.accept = ".zip";
            }, 10);

            area.addEventListener("change", async () => {
                if (area.files.length == 0) return;
                let file = area.files[0];
                title.innerText = file.name;
                let resp = await DoRequestWithFile("POST", `/api/archive/${full.ID}/upload`, {"file": file}, {
                    onProgress: (fraction) => {
                        subtitle.innerText = "Uploading... " + Math.round(fraction * 100) + "%";
                    }
                });
                await this.Changed(resp, "file");
            });
        });
    }

    static RenderScreenshots(full) {
        let screens = this.GameScreenOptions();

        let reorder = async (from, to) => {
            let ids = full.Screenshots.map(screenshot => screenshot.ID);
            let moved = ids.splice(from, 1)[0];
            ids.splice(to, 0, moved);
            let resp = await DoRequest("POST", `/api/archive/${full.ID}/screenshots/reorder`, {"ids": JSON.stringify(ids)});
            await this.Changed(resp, "screenshots");
        };

        return this.Panel("Screenshots", () => {
            D2.Div("archive-editor-screenshots", () => {
                full.Screenshots.forEach((screenshot, index) => {
                    D2.Div("archive-editor-screenshot", () => {
                        D2.Div("image", () => {
                            D2.Image("", screenshot.Thumb);

                            // only show on hover
                            D2.Div("controls left", () => {
                                let up = D2.IconOnlyButton("chevron-left");
                                up.disabled = index == 0;
                                up.addEventListener("click", () => reorder(index, index - 1));

                                let down = D2.IconOnlyButton("chevron-right");
                                down.disabled = index == full.Screenshots.length - 1;
                                down.addEventListener("click", () => reorder(index, index + 1));
                            });
                            D2.Div("controls right", () => {
                                let del = D2.IconOnlyButton("trash");
                                del.addEventListener("click", async () => {
                                    let resp = await DoRequest("POST", `/api/archive/screenshots/${screenshot.ID}/delete`);
                                    await this.Changed(resp, "screenshots");
                                });
                            });
                        });

                        this.Dropdown(screens, screenshot.Game_Screen, true, async (value) => {
                            let resp = await DoRequest("POST", `/api/archive/screenshots/${screenshot.ID}/edit`, {"game_screen": value});
                            await this.Changed(resp);
                        });
                    });
                });
            });

            let area = this.DragArea(true);
            area.addEventListener("change", async () => {
                if (area.files.length == 0) return;
                let before = full.Screenshots.map(screenshot => screenshot.ID);
                let loader = new LoaderOverlay("Uploading screenshots");

                // one at a time, same as the api expects
                let resp = null;
                for (let file of area.files) {
                    resp = await DoRequestWithFile("POST", `/api/archive/${full.ID}/screenshots/add`, {"file": file, "game_screen": ""});
                    if (!resp.success) break;
                }
                loader.overlay.remove();
                if (!resp.success) {
                    await this.Changed(resp, "screenshots");
                    return;
                }

                let added = resp.content.Screenshots.filter(screenshot => !before.includes(screenshot.ID));
                await this.AskGameScreens(added);
                let fresh = await DoRequest("GET", `/api/archive/${full.ID}`);
                await this.Changed(fresh, "screenshots");
            });
        }, () => {
            let guess = D2.Text("button", "Guess all", "button cta pill-button");
            guess.setAttribute("tooltip", "Reads the text on each screenshot to guess what it is. Overwrites existing types, unless it has no idea");
            guess.addEventListener("click", async () => {
                let todo = full.Screenshots;
                if (todo.length == 0) return;

                guess.disabled = true;
                let guessed = 0;
                try {
                    guess.innerText = "Guessing 0/" + todo.length + "...";
                    let screens = await ArchiveOCR.GuessAll(todo, (done) => {
                        guess.innerText = "Guessing " + done + "/" + todo.length + "...";
                    });
                    for (let i = 0; i < todo.length; i++) {
                        // no idea means keep whatever it already was
                        if (screens[i] == null) continue;
                        guessed++;
                        if (screens[i] == todo[i].Game_Screen) continue;
                        await DoRequest("POST", `/api/archive/screenshots/${todo[i].ID}/edit`, {"game_screen": screens[i]});
                    }
                } catch (e) {
                    console.error("[archive ocr]", e);
                    PushToast({theme: "error", content: "OCR failed, check the console"});
                }
                await ArchiveOCR.Terminate();

                PushToast({theme: "success", content: "Guessed " + guessed + " of " + todo.length + " screenshots"});
                let fresh = await DoRequest("GET", `/api/archive/${full.ID}`);
                await this.Changed(fresh, "screenshots");
            });
        });
    }

    static RenderMirrors(full) {
        return this.Panel("Mirrors", () => {
            D2.Div("archive-editor-mirrors", () => {
                for (let mirror of full.Mirrors) {
                    D2.Div("archive-editor-mirror", () => {
                        let link = D2.Link(mirror.Name, "", mirror.URL);
                        link.target = "_blank";
                        let del = D2.IconOnlyButton("trash");
                        del.addEventListener("click", async () => {
                            let resp = await DoRequest("POST", `/api/archive/mirrors/${mirror.ID}/delete`);
                            await this.Changed(resp, "mirrors");
                        });
                    });
                }
            });

            let name, url;
            D2.Div("form", () => {
                this.Field("Name", () => {
                    name = D2.Input("", "text");
                });
                this.Field("URL", () => {
                    url = D2.Input("", "text");
                });
            });
            let add = D2.Text("button", "Add Mirror", "lumen-button");
            add.addEventListener("click", async () => {
                let resp = await DoRequest("POST", `/api/archive/${full.ID}/mirrors/add`, {"name": name.value, "url": url.value});
                await this.Changed(resp, "mirrors");
            });
        });
    }
}
