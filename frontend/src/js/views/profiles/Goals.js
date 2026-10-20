import {DoRequest} from "../../utils/requests";
import {D2} from "../../utils/d2";
import {UTCify} from "../../utils/time";
import {PushToast} from "../../ui/toasts";
import {Modal, ModalButton, ModalIcon} from "../../ui/overlay";

const MODES = [
    {"Key": "osu", "Name": "osu!"},
    {"Key": "taiko", "Name": "osu!taiko"},
    {"Key": "catch", "Name": "osu!catch"},
    {"Key": "mania", "Name": "osu!mania"},
];

export default class Goals {
    main;
    constructor(main) {
        this.main = main;
        this.init()
    }

    el = null;
    els = [];

    goals = [];
    types = [];

    selectedType = null;
    selectedMode = null;

    async init() {
        this.goals = this.main.profile.Goals.content ?? [];

        this.selectedMode = this.main.gamemode;
        if (this.selectedMode == "fruits") this.selectedMode = "catch";

        this.el = D2.Div("goals", () => {
            this.els.list = D2.Div("goal-list", () => {

            });
        })

        document.getElementById("goals-outer").appendChild(this.el);

        let types = await DoRequest("GET", "/api/profiles/goals/types");
        this.types = types['content'];
        this.selectedType = this.types[0];

        this.renderList();

        if (this.main.Am_User()) {
            this.el.appendChild(this.renderInput());
        }
    }

    getType(key) {
        let type = this.types.find(t => t.Key == key);
        if (type) return type;
        return {"Key": key, "Name": key, "Icon": "icon-goals-pp", "Per_Mode": true};
    }

    getModeName(key) {
        let mode = MODES.find(m => m.Key == key);
        if (mode) return mode.Name;
        return key;
    }

    format(value) {
        if (value === null) return "?";
        return Number(value).toLocaleString();
    }

    // unfinished first (closest to done on top), then finished (newest on top)
    sortedGoals() {
        return [...this.goals].sort((a, b) => {
            let aDone = a.Claimed !== null;
            let bDone = b.Claimed !== null;
            if (aDone !== bDone) {
                if (aDone) return 1;
                return -1;
            }
            if (aDone) {
                return new Date(b.Claimed) - new Date(a.Claimed);
            }
            return (b.Progress ?? 0) - (a.Progress ?? 0);
        });
    }

    renderList() {
        this.els.list.innerHTML = "";

        if (this.goals.length == 0) {
            this.els.list.appendChild(D2.Div("goal-empty", () => {
                D2.LucideIcon("flag");
                if (this.main.Am_User()) {
                    D2.Text("p", "You don't have any goals yet, set one below!");
                } else {
                    D2.Text("p", "This user doesn't have any goals yet.");
                }
            }));
            return;
        }

        for (let goal of this.sortedGoals()) {
            this.els.list.appendChild(this.renderGoal(goal));
        }
    }

    renderGoal(goal) {
        let type = this.getType(goal.Type);
        let complete = goal.Claimed !== null;
        let progress = goal.Progress ?? 0;
        if (complete) progress = 1;

        let el = D2.Div("goal", () => {
            D2.Div("goal-icon", () => {
                D2.Custom("i", type.Icon);
            });

            D2.Div("goal-main", () => {
                D2.Div("goal-top", () => {
                    D2.Div("goal-title", () => {
                        D2.StyledText("h2", `<strong>${this.format(goal.Value)}</strong> ${type.Name}`);
                        D2.Div("goal-meta", () => {
                            if (goal.Gamemode !== null) {
                                let mode = D2.Div("goal-mode-tag", () => {
                                    D2.Custom("i", "icon-gamemode-" + goal.Gamemode);
                                });
                                mode.setAttribute("tooltip", this.getModeName(goal.Gamemode));
                            }
                            if (complete) {
                                D2.StyledText("p", `Completed <strong>${D2.TimeRelative(UTCify(goal.Claimed))}</strong>`);
                            } else {
                                D2.StyledText("p", `Started <strong>${D2.TimeRelative(UTCify(goal.Creation_Date))}</strong>`);
                            }
                        });
                    });

                    D2.Div("goal-status", () => {
                        if (complete) {
                            D2.Div("goal-complete-tag", () => {
                                D2.LucideIcon("check");
                            });
                        } else {
                            D2.Text("h3", Math.floor(progress * 100) + "%");
                            D2.Text("p", this.format(goal.Current_Value));
                        }
                    });

                });

                D2.Div("goal-progress", () => {
                    D2.CustomPlus("div", "goal-progress-inner", {"style": `width: ${progress * 100}%`}, () => {
                    });
                });
            });
        });

        if (this.main.Am_User()) {
            let del = D2.IconButton("x", "", "goal-delete");
            del.setAttribute("tooltip", "Delete goal");
            del.addEventListener("click", () => {
                this.confirmDelete(goal);
            });
            el.appendChild(del);
        }

        if (complete) el.classList.add("complete");
        return el;
    }

    renderInput() {
        let input = null;

        let el = D2.Div("goal-input", () => {
            this.els.typeButtons = D2.Div("goal-type-picker", () => {
                for (let type of this.types) {
                    let button = D2.Div("goal-type-button", () => {
                        D2.Custom("i", type.Icon);
                        D2.Text("p", type.Name);
                    });
                    button.typeKey = type.Key;
                    button.addEventListener("click", () => {
                        this.selectedType = type;
                        this.updatePickers();
                    });
                }
            });

            D2.Div("goal-input-row", () => {
                input = D2.Input("Target", "number");
                input.min = "0";
                input.addEventListener("keydown", (e) => {
                    if (e.key == "Enter") this.addGoal(input);
                });

                this.els.modeSelector = document.createElement("gamemode-selector");
                this.els.modeSelector.value = this.selectedMode;
                this.els.modeSelector.addEventListener("change", (e) => {
                    this.selectedMode = e.detail;
                });
                D2._currentParent.appendChild(this.els.modeSelector);

                let add = D2.IconButton("plus", "Add", "lumen-button primary");
                add.addEventListener("click", () => {
                    this.addGoal(input);
                });
            });
        });

        this.updatePickers();
        return el;
    }

    updatePickers() {
        for (let button of this.els.typeButtons.children) {
            button.classList.toggle("active", button.typeKey == this.selectedType.Key);
        }
        // medals and badges don't care about mode
        this.els.modeSelector.toggleAttribute("disabled", !this.selectedType.Per_Mode);
    }

    async addGoal(input) {
        if (input.value == "") return;

        let response = await DoRequest("POST", "/api/profiles/goals/add", {
            "type": this.selectedType.Key,
            "value": input.value,
            "gamemode": this.selectedMode
        });

        if (!response.success) {
            PushToast({theme: "error", content: response.message});
            return;
        }

        input.value = "";
        this.goals = response.content;
        this.renderList();
    }

    confirmDelete(goal) {
        let type = this.getType(goal.Type);
        let modal = new Modal("Delete this goal?", `Your ${this.format(goal.Value)} ${type.Name} goal will be gone for good.`, [
            new ModalButton("Delete", async () => {
                modal.close();
                await this.deleteGoal(goal);
            }),
            new ModalButton("Cancel", () => {
                modal.close();
            })
        ], new ModalIcon("alert-triangle", "#ff623e"));
    }

    async deleteGoal(goal) {
        let response = await DoRequest("POST", "/api/profiles/goals/" + goal.ID + "/delete");

        if (!response.success) {
            PushToast({theme: "error", content: response.message});
            return;
        }

        this.goals = response.content;
        this.renderList();
    }
}
