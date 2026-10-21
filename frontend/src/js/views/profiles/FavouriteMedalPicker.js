import {D2} from "../../utils/d2";
import {DoRequest} from "../../utils/requests";
import {PushToast} from "../../ui/toasts";
import {Overlay} from "../../ui/overlay";
import {Misc} from "../../utils/misc";
import {GamemodeToName} from "../../utils/osu/gamemode";

export const MODE_ORDER = ["all", "osu", "taiko", "catch", "mania"];

// grouped the same way as the medals sidebar, include decides which medals go in
export function categorize(medals, include = (medal) => medal.Obtained) {
    let groups = {};
    for (let name of Misc.Medals.GroupingOrdering) {
        groups[name] = {};
    }

    for (let medal of medals) {
        if (!include(medal)) continue;

        let mode = medal.Gamemode ?? "all";
        if (mode == "fruits") mode = "catch";

        if (typeof (groups[medal.Grouping]) == "undefined") groups[medal.Grouping] = {};
        if (typeof (groups[medal.Grouping][mode]) == "undefined") groups[medal.Grouping][mode] = [];
        groups[medal.Grouping][mode].push(medal);
    }

    for (let group of Object.values(groups)) {
        for (let mode in group) {
            group[mode].sort((a, b) => a.Ordering - b.Ordering);
        }
    }

    return groups;
}

// onSaved gets the new medal id
export function OpenFavouriteMedalPicker(profile, onSaved) {
    let selected = profile.Favourite_Medal;
    let buttons = [];
    let sections = [];
    let search = null;
    let noResults = null;
    let overlay = null;

    let inner = D2.Div("panel medal-picker", () => {
        D2.Text("h1", "Pick your favourite medal");
        D2.Div("divider", () => {
        });

        D2.Div("medal-picker-search", () => {
            D2.LucideIcon("search");
            search = D2.Input("Search your medals...", "text");
        });

        D2.Div("medal-picker-list", () => {
            let groups = categorize(profile.Medals);

            for (let groupName in groups) {
                let group = groups[groupName];
                if (Object.keys(group).length == 0) continue;

                let section = D2.Div("medal-picker-section", () => {
                    D2.Text("h2", groupName);

                    for (let mode of MODE_ORDER) {
                        if (!group[mode]) continue;

                        D2.Div("medal-picker-mode", () => {
                            if (Object.keys(group).length > 1) {
                                D2.Div("medal-picker-mode-header", () => {
                                    D2.Custom("i", "icon-gamemode-" + mode);
                                    D2.Text("p", GamemodeToName(mode));
                                });
                            }

                            D2.Div("medal-picker-grid", () => {
                                for (let medal of group[mode]) {
                                    let button = D2.Div("medal-picker-medal", () => {
                                        D2.MedalIcon(medal.Link);
                                    });
                                    button.setAttribute("tooltip", medal.Name);
                                    button.searchText = (medal.Name + " " + (medal.Description ?? "")).toLowerCase();
                                    button.medalId = medal.Medal_ID;
                                    if (medal.Medal_ID == selected) button.classList.add("selected");

                                    button.addEventListener("click", () => {
                                        selected = medal.Medal_ID;
                                        for (let b of buttons) {
                                            b.classList.toggle("selected", b.medalId == selected);
                                        }
                                    });

                                    // double click to pick straight away
                                    button.addEventListener("dblclick", () => {
                                        save();
                                    });

                                    buttons.push(button);
                                }
                            });
                        });
                    }
                });
                sections.push(section);
            }

            noResults = D2.Text("p", "No medals match that search", "medal-picker-empty");
        });

        D2.Div("button-row", () => {
            D2.Button("Cancel", "", () => {
                overlay.remove();
            });
            D2.Button("Confirm", "cta", () => {
                save();
            });
        });
    });

    search.addEventListener("input", () => {
        let query = search.value.trim().toLowerCase();

        for (let button of buttons) {
            button.classList.toggle("hidden", query != "" && !button.searchText.includes(query));
        }

        // hide whatever ends up empty
        for (let mode of inner.querySelectorAll(".medal-picker-mode")) {
            mode.classList.toggle("hidden", mode.querySelector(".medal-picker-medal:not(.hidden)") === null);
        }
        let anyVisible = false;
        for (let section of sections) {
            let visible = section.querySelector(".medal-picker-medal:not(.hidden)") !== null;
            section.classList.toggle("hidden", !visible);
            if (visible) anyVisible = true;
        }
        noResults.classList.toggle("visible", !anyVisible);
    });

    async function save() {
        if (selected === null || selected == profile.Favourite_Medal) {
            overlay.remove();
            return;
        }

        let response = await DoRequest("POST", "/api/profiles/favourite-medal", {"medal": selected});
        if (!response.success) {
            PushToast({theme: "error", content: response.message});
            return;
        }

        overlay.remove();
        onSaved(response.content);
    }

    overlay = new Overlay(inner);
    search.focus();
}
