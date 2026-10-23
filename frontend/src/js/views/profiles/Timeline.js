import {DoRequest} from "../../utils/requests";
import {D2} from "../../utils/d2";
import {PushToast} from "../../ui/toasts";
import {Modal, ModalButton, ModalIcon, Overlay} from "../../ui/overlay";

const MODES = [
    {"Key": "", "Name": "Any mode", "Icon": "icon-gamemode-all"},
    {"Key": "osu", "Name": "osu!", "Icon": "icon-gamemode-osu"},
    {"Key": "taiko", "Name": "osu!taiko", "Icon": "icon-gamemode-taiko"},
    {"Key": "catch", "Name": "osu!catch", "Icon": "icon-gamemode-catch"},
    {"Key": "mania", "Name": "osu!mania", "Icon": "icon-gamemode-mania"},
];

export default class Timeline {
    main;
    constructor(main) {
        this.main = main;
        this.init()
    }

    el = null;
    els = [];

    entries = [];

    // the date string of the dot that's open
    selected = null;

    init() {
        this.entries = this.main.profile.Timeline.content ?? [];

        this.el = D2.Div("timeline", () => {
            this.els.trackOuter = D2.Div("timeline-track-outer", () => {
                this.els.dateTip = D2.Div("timeline-date-tip", () => {
                });
                this.els.ghost = D2.Div("timeline-ghost", () => {
                });
                this.els.track = D2.Div("timeline-track", () => {
                });
                this.els.detail = D2.Div("timeline-detail", () => {
                });
            });
            this.els.labels = D2.Div("timeline-labels", () => {
                D2.Text("p", this.formatDate(this.main.profile.User.join_date));
                D2.Text("p", "Today");
            });
        })

        document.getElementById("timeline-outer").appendChild(this.el);

        if (this.main.Am_User()) {
            this.el.classList.add("editable");
        }

        this.els.trackOuter.addEventListener("mousemove", (e) => {
            this.onTrackHover(e);
        });
        this.els.trackOuter.addEventListener("mouseleave", () => {
            this.hideHover();
        });
        this.els.trackOuter.addEventListener("click", (e) => {
            this.onTrackClick(e);
        });

        // clicking anywhere else closes the pinned card, popups don't count
        document.addEventListener("click", (e) => {
            if (this.selected === null) return;
            // composedPath still has the dot even after render() swapped it out
            if (e.composedPath().includes(this.el)) return;
            if (e.target.closest(".overlay")) return;
            this.selected = null;
            this.render();
        });

        this.render();
    }

    getMode(key) {
        if (key === null) key = "";
        return MODES.find(m => m.Key == key) ?? MODES[0];
    }

    formatDate(date) {
        // dates come in as yyyy-mm-dd (or a full timestamp for join date)
        if (!date) return "Unknown";
        return new Date(date.substring(0, 10) + "T00:00:00").toLocaleDateString(undefined, {
            "day": "numeric",
            "month": "short",
            "year": "numeric"
        });
    }

    formatMonth(date) {
        return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
            "month": "long",
            "year": "numeric"
        });
    }

    // rounds to the closest month, 16th onwards goes to the next one
    monthOf(date) {
        let at = new Date(date.substring(0, 10) + "T00:00:00");
        if (at.getDate() >= 16) {
            at = new Date(at.getFullYear(), at.getMonth() + 1, 1);
        }
        let month = String(at.getMonth() + 1).padStart(2, "0");
        return at.getFullYear() + "-" + month + "-01";
    }

    today() {
        return new Date().toISOString().substring(0, 10);
    }

    // points in the same (rounded) month share one dot
    groupedEntries() {
        let groups = [];
        for (let entry of this.entries) {
            let month = this.monthOf(entry.Date);
            let group = groups.find(g => g.Date == month);
            if (!group) {
                group = {"Date": month, "Entries": []};
                groups.push(group);
            }
            group.Entries.push(entry);
        }
        groups.sort((a, b) => new Date(a.Date) - new Date(b.Date));
        for (let group of groups) {
            group.Entries.sort((a, b) => new Date(a.Date) - new Date(b.Date));
        }
        return groups;
    }

    // x on the track (0-1) -> yyyy-mm-dd
    dateAt(pos) {
        let start = new Date(this.main.profile.User.join_date).getTime();
        let end = Date.now();
        let at = new Date(start + (end - start) * pos);
        return at.toISOString().substring(0, 10);
    }

    trackPos(e) {
        let rect = this.els.track.getBoundingClientRect();
        let pos = (e.clientX - rect.left) / rect.width;
        if (pos < 0) pos = 0;
        if (pos > 1) pos = 1;
        return pos;
    }

    showDateTip(pos, text) {
        this.els.dateTip.innerText = text;
        this.els.dateTip.style.left = (pos * 100) + "%";
        this.els.dateTip.classList.add("visible");
    }

    onTrackHover(e) {
        // the card sits inside the track box, leave it alone while it's hovered
        if (e.target.closest(".timeline-detail")) {
            this.els.ghost.classList.remove("visible");
            this.els.dateTip.classList.remove("visible");
            return;
        }

        let dot = e.target.closest(".timeline-dot");

        if (dot) {
            this.els.ghost.classList.remove("visible");
            // the card has the month in it, no need for the pill too
            this.els.dateTip.classList.remove("visible");
            this.renderDetail(dot.groupDate);
            return;
        }

        // back to the pinned one when off a dot
        this.renderDetail(this.selected);

        if (!this.main.Am_User()) {
            this.els.dateTip.classList.remove("visible");
            return;
        }

        let pos = this.trackPos(e);
        this.els.ghost.style.left = (pos * 100) + "%";
        this.els.ghost.classList.add("visible");
        this.showDateTip(pos, "Add on " + this.formatDate(this.dateAt(pos)));
    }

    hideHover() {
        this.els.ghost.classList.remove("visible");
        this.els.dateTip.classList.remove("visible");
        this.renderDetail(this.selected);
    }

    onTrackClick(e) {
        // clicks in the card are handled by its own buttons
        if (e.target.closest(".timeline-detail")) return;

        let dot = e.target.closest(".timeline-dot");

        if (dot) {
            this.selected = dot.groupDate;
            this.render();
            return;
        }

        if (!this.main.Am_User()) return;
        this.openEditor(null, this.dateAt(this.trackPos(e)));
    }

    position(date) {
        let start = new Date(this.main.profile.User.join_date).getTime();
        let end = Date.now();
        let at = new Date(date + "T00:00:00").getTime();

        let pos = (at - start) / (end - start);
        if (pos < 0) pos = 0;
        if (pos > 1) pos = 1;
        return pos;
    }

    render() {
        this.shownDetail = undefined;
        this.renderTrack();
        this.renderDetail();
    }

    renderTrack() {
        this.els.track.innerHTML = "";

        // tips live inside the track so their % lines up with the dots
        this.els.track.appendChild(this.els.dateTip);
        this.els.track.appendChild(this.els.ghost);

        for (let group of this.groupedEntries()) {
            let dot = D2.Div("timeline-dot", () => {
                if (group.Entries.length > 1) {
                    D2.Text("p", group.Entries.length);
                }
            });
            dot.style.left = (this.position(group.Date) * 100) + "%";
            dot.groupDate = group.Date;
            if (group.Date == this.selected) dot.classList.add("active");

            this.els.track.appendChild(dot);
        }
    }

    // shows the event card under the dot for that date
    renderDetail(date = this.selected) {
        if (this.shownDetail === date && this.els.detail.childNodes.length > 0) return;
        this.shownDetail = date;
        this.els.detail.innerHTML = "";
        this.els.detail.style.removeProperty("--arrow");
        this.els.detail.classList.remove("card");
        this.els.detail.classList.remove("clicked");

        if (this.entries.length == 0) {
            this.els.detail.appendChild(D2.Div("timeline-empty", () => {
                if (this.main.Am_User()) {
                    D2.Text("p", "You don't have any items on your timeline yet, click anywhere along it to add one!");
                } else {
                    D2.Text("p", "This user hasn't added anything to their timeline yet.");
                }
            }));
            return;
        }

        let group = this.groupedEntries().find(g => g.Date == date);
        if (!group) return;

        this.els.detail.classList.add("card");
        // hover is just a preview, the buttons only show once the dot's been clicked
        this.els.detail.classList.toggle("clicked", date === this.selected);
        this.els.detail.appendChild(D2.Text("h2", this.formatMonth(group.Date)));

        for (let entry of group.Entries) {
            let mode = this.getMode(entry.Mode);

            let el = D2.Div("timeline-entry", () => {
                let icon = D2.Custom("i", mode.Icon);
                icon.setAttribute("tooltip", mode.Name);

                D2.Div("timeline-entry-text", () => {
                    D2.Text("p", entry.Note);
                    D2.Text("small", this.formatDate(entry.Date));
                });

                if (this.main.Am_User()) {
                    D2.Div("timeline-entry-buttons", () => {
                        let edit = D2.IconButton("pencil", "", "timeline-entry-button");
                        edit.setAttribute("tooltip", "Edit");
                        edit.addEventListener("click", () => {
                            this.openEditor(entry);
                        });

                        let del = D2.IconButton("trash-2", "", "timeline-entry-button danger");
                        del.setAttribute("tooltip", "Delete");
                        del.addEventListener("click", () => {
                            this.confirmDelete(entry);
                        });
                    });
                }
            });

            this.els.detail.appendChild(el);
        }

        if (this.main.Am_User()) {
            let latest = group.Entries[group.Entries.length - 1];
            let add = D2.Div("timeline-entry timeline-add-another", () => {
                D2.LucideIcon("plus");
                D2.Div("timeline-entry-text", () => {
                    D2.Text("p", "Add another");
                });
            });
            add.addEventListener("click", () => {
                this.openEditor(null, latest.Date);
            });
            this.els.detail.appendChild(add);
        }

        this.placeDetail(this.position(group.Date));
    }

    // centre the card on the dot, but keep it inside the panel
    placeDetail(pos) {
        let outer = this.els.trackOuter.getBoundingClientRect();
        let track = this.els.track.getBoundingClientRect();
        let width = this.els.detail.getBoundingClientRect().width;

        // dot position relative to the outer box the card sits in
        let x = track.left - outer.left + pos * track.width;

        let left = x - width / 2;
        if (left < 0) left = 0;
        if (left > outer.width - width) left = outer.width - width;

        this.els.detail.style.left = left + "px";
        this.els.detail.style.setProperty("--arrow", (x - left) + "px");
    }

    // entry null = adding a new one
    openEditor(entry, date = null) {
        let isNew = entry === null;
        let selectedMode = "";
        if (!isNew) selectedMode = entry.Mode ?? "";

        let dateInput = null;
        let noteInput = null;
        let overlay = null;

        let inner = D2.Div("panel timeline-editor", () => {
            if (isNew) {
                D2.Text("h1", "Add timeline point");
            } else {
                D2.Text("h1", "Edit timeline point");
            }
            D2.Div("divider", () => {
            });

            D2.Text("p", "Date", "timeline-editor-label");
            dateInput = D2.Input("", "date");
            dateInput.min = this.main.profile.User.join_date.substring(0, 10);
            dateInput.max = this.today();
            if (isNew) {
                dateInput.value = date ?? this.today();
            } else {
                dateInput.value = entry.Date;
            }

            D2.Text("p", "What happened?", "timeline-editor-label");
            noteInput = D2.TextArea("Got my first 727pp play!", 3, isNew ? "" : entry.Note);
            noteInput.maxLength = 500;

            // mode can't change once it's set, same as eclipse
            if (isNew) {
                D2.Text("p", "Gamemode", "timeline-editor-label");
                let modeSelector = document.createElement("gamemode-selector");
                modeSelector.setAttribute("allow-all", "");
                modeSelector.value = selectedMode;
                modeSelector.addEventListener("change", (e) => {
                    selectedMode = e.detail;
                });
                D2._currentParent.appendChild(modeSelector);
            }

            D2.Div("button-row", () => {
                D2.Button("Cancel", "", () => {
                    overlay.remove();
                });
                D2.Button(isNew ? "Add" : "Save", "cta", async () => {
                    let saved = await this.save(entry, dateInput.value, noteInput.value, selectedMode);
                    if (saved) overlay.remove();
                });
            });
        });

        overlay = new Overlay(inner);
        noteInput.focus();
    }

    async save(entry, date, note, mode) {
        if (note.trim() == "") {
            PushToast({theme: "error", content: "Write something first!"});
            return false;
        }

        let response = null;
        if (entry === null) {
            response = await DoRequest("POST", "/api/profiles/timeline/add", {
                "date": date,
                "note": note,
                "mode": mode
            });
        } else {
            response = await DoRequest("POST", "/api/profiles/timeline/" + entry.ID + "/edit", {
                "date": date,
                "note": note
            });
        }

        if (!response.success) {
            PushToast({theme: "error", content: response.message});
            return false;
        }

        this.entries = response.content;
        this.selected = this.monthOf(date);
        this.render();
        return true;
    }

    confirmDelete(entry) {
        let modal = new Modal("Delete this timeline point?", "It'll be gone for good.", [
            new ModalButton("Delete", async () => {
                modal.close();
                await this.deleteEntry(entry);
            }),
            new ModalButton("Cancel", () => {
                modal.close();
            })
        ], new ModalIcon("alert-triangle", "#ff623e"));
    }

    async deleteEntry(entry) {
        let response = await DoRequest("POST", "/api/profiles/timeline/" + entry.ID + "/delete");

        if (!response.success) {
            PushToast({theme: "error", content: response.message});
            return;
        }

        this.entries = response.content;

        // close the card if that month is empty now
        let groups = this.groupedEntries();
        if (!groups.find(g => g.Date == this.selected)) {
            this.selected = null;
        }

        this.render();
    }
}
