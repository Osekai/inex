import {AntheraIcon, Div, Image, Text} from "../../../utils/dom";
import {Misc} from "../../../utils/misc";
import {MedalData} from "../MedalData";
import {SetMedal} from "../../medals";
import {GamemodeToName} from "../../../utils/osu/gamemode";
import {GetSetting, OnChangeSetting} from "../../../utils/usersettings";

String.prototype.includes_nl = function (text) {
    return this.toLowerCase().includes(text.toLowerCase());
}

export class MedalsSidebar {
    categorized = {};

    InitializeCategory(full, cat) {
        full[cat] = {"all": [], "osu": [], "taiko": [], "catch": [], "mania": []};
    }


    Search(rawtext = null) {
        if (rawtext == null) {
            rawtext = document.getElementById("medal_search").rawtext;
        }
        if (rawtext.length > 0) {
            document.getElementById("medal_search_clear").classList.remove("hidden");
        } else {
            document.getElementById("medal_search_clear").classList.add("hidden");
        }

        var text = "";

        var attributes = [];

        for (var split of rawtext.split(" ")) {
            if (split.startsWith("@")) {
                var attribute = split.replace("@", "");
                var operatorMatch = attribute.match(/(=|!=|>=|<=|>|<)/); // Match any operator

                if (operatorMatch) {
                    var operator = operatorMatch[0]; // Extract the operator
                    var parts = attribute.split(operator);
                    var attr_name = parts[0];
                    var attr_val = parts[1];

                    attributes.push({
                        name: attr_name.toLowerCase(),
                        value: attr_val.toLowerCase(),
                        operator: operator
                    })
                }
            } else {
                text += split + " ";
            }
        }
        text = text.trim();

        var exact = false;
        if (text.startsWith("\"") && text.endsWith("\"")) {
            exact = true;
            text = text.substring(1, text.length - 1);
        }
        text = text.replace('"', '');

        function CheckValueWithOperator(v1, v2, op) {
            if (v2 === "") return true;

            const operations = {
                "=": (a, b) => a === b,
                "!=": (a, b) => a !== b,
                ">": (a, b) => a > b,
                "<": (a, b) => a < b,
                ">=": (a, b) => a >= b,
                "<=": (a, b) => a <= b
            };

            const show = operations[op]?.(v1, v2) || false;
            return show;
        }

        function parseBool(b) {
            if (b === true || b === "1" || b === "true") return true;
            if (b === false || b === "0" || b === "false") return false;
            return "";
        }


        for (let medal of Object.values(MedalData.GetMedalsSync())) {
            var show = false;
            if (medal.Name.includes_nl(text)) {
                show = true;
            }
            if (!exact) {
                if (medal.Description.includes_nl(text)) {
                    show = true;
                }
                if (medal.Instructions != null && medal.Instructions.includes_nl(text)) {
                    show = true;
                }
            }

            for (let attr of attributes) {
                switch (attr.name) {
                    case "supportslazer":
                    case "canlazer": {
                        let attrValue = parseBool(attr.value);
                        if (!CheckValueWithOperator(parseBool(medal.Supports_Lazer), attrValue, attr.operator)) show = false;
                        break;
                    }
                    case "supportsstable":
                    case "canstable": {
                        let attrValue = parseBool(attr.value);
                        if (!CheckValueWithOperator(parseBool(medal.Supports_Stable), attrValue, attr.operator)) show = false;
                        break;
                    }
                    case "modsexact":
                    case "exactmods": {
                        if (medal.Mods == null) {
                            show = false;
                            break;
                        }
                        let attrValue = attr.value;
                        let mods = medal.Mods.split(",");

                        for (let mod of mods) {
                            if (!attrValue.includes(mod.toLowerCase())) {
                                show = false;
                                console.log("matching", mod, "to", attrValue, "fail");
                                break; // Exit the loop early if any mod fails
                            }
                        }
                        break;
                    }
                    case "mods":
                    case "hasmod":
                    case "mod": {
                        if (medal.Mods == null) {
                            show = false;
                            break;
                        }
                        let attrValue = attr.value;
                        let mods = medal.Mods.split(",");

                        let hasAnyMods = mods.some(mod => attrValue.includes(mod.toLowerCase()));
                        if (!hasAnyMods) show = false;
                        break;
                    }
                }
            }

            if (medal.Obtained && GetSetting("medals.hideUnachievedMedals", false, true) == true && GetSetting("medals.hide_obtained", false, true) == true) {
                show = false;
            }


            if (show) {
                medal.Button.classList.remove("hidden");
                medal.Button.classList.add("visible");
            } else {
                medal.Button.classList.add("hidden");
                medal.Button.classList.remove("visible");
            }
        }

        this.HideSectionsWithNoVisibleMedals();


        if (document.getElementById("sidebar").querySelectorAll(".visible").length === 0) {
            document.getElementById("no-results").classList.remove("hidden");
        } else {
            document.getElementById("no-results").classList.add("hidden");
        }

    }

    RenderMedalGrid(medals) {
        var grid = Div("div", "medals__medal-grid");
        for (let medal of medals) {
            let medalButton = Div("button", "medals__medal-button");
            medalButton.append(Image("/assets/osu/web/" + medal.Link, "", true))
            medalButton.setAttribute("tooltip", medal.Name)

            medalButton.setAttribute("medal-button-id", medal.Medal_ID);


            medalButton.addEventListener("click", () => {
                SetMedal(medal.Medal_ID, true);
            })

            medalButton.classList.add("visible");

            if (medal.Obtained) {
                medalButton.classList.add("obtained");
            }


            grid.appendChild(medalButton);

            medal.Button = medalButton;
        }
        return grid;
    }

    RenderGamemode(gamemode, name) {
        var gamemodecategorydiv = Div("div", "medals__medal-gamemodesection");
        var modeheader = Text("h2", GamemodeToName(name));

        modeheader.prepend(AntheraIcon("icon-gamemode-" + name));

        gamemodecategorydiv.appendChild(modeheader);
        for (let ordering of gamemode) {
            if (typeof (ordering) == "undefined") continue;

            gamemodecategorydiv.appendChild(this.RenderMedalGrid(ordering));
        }

        gamemodecategorydiv.classList.add("gamemode-" + name);
        gamemodecategorydiv.classList.add("col-reset");


        gamemodecategorydiv.style.animationDelay = this.offset + "s";
        this.offset += 0.01;

        return gamemodecategorydiv;
    }

    offset = 0;

    RenderSection(category, name) {
        var categorydiv = Div("div", "medals__medal-section");
        var header = Text("h1", name);
        categorydiv.appendChild(header);
        for (var mode in category) {
            if (category[mode].length == 0) continue;

            categorydiv.appendChild(this.RenderGamemode(category[mode], mode));
        }

        return categorydiv;
    }

    LoadSidebar() {
        var sidebar = document.getElementById("sidebar");
        sidebar.innerHTML = "";

        for (var cat of Misc.Medals.GroupingOrdering) {
            this.InitializeCategory(this.categorized, cat);
        }

        for (let medal of Object.values(MedalData.GetMedalsSync())) {
            if (typeof (this.categorized[medal.Grouping]) == "undefined") {
                this.InitializeCategory(categorized, medal.Grouping);
            }

            var gamemode = medal.GetGamemode();

            if (typeof (this.categorized[medal.Grouping][gamemode]) == "undefined") {
                this.categorized[medal.Grouping][gamemode] = [];
            }
            if (typeof (this.categorized[medal.Grouping][gamemode][medal.Ordering]) == "undefined") {
                this.categorized[medal.Grouping][gamemode][medal.Ordering] = [];
            }

            this.categorized[medal.Grouping][gamemode][medal.Ordering].push(medal);
        }


        for (var category in this.categorized) {
            sidebar.append(this.RenderSection(this.categorized[category], category));
        }

        var searchbar = document.getElementById("medal_search");
        searchbar.addEventListener("keyup", () => {
            this.Search(searchbar.value);
        })

        OnChangeSetting("medals.hide_obtained", () => {
            this.Search();
        })
        OnChangeSetting("medals.hideUnachievedMedals", () => {
            this.Search();
        })

        document.getElementById("medal_search_clear").addEventListener("click", () => {
            searchbar.value = "";
            this.Search("");
        })
        this.Search(searchbar.value);

    }

    HideSectionsWithNoVisibleMedals() {
        function checkSection(classname) {
            for (var sect of document.querySelectorAll(classname)) {
                if ((sect.querySelectorAll(".visible").length + sect.querySelectorAll(".noobtain-visible").length) === 0) {
                    sect.classList.add("hidden");
                } else {
                    sect.classList.remove("hidden");
                }
            }
        }

        checkSection(".medals__medal-grid");
        checkSection(".medals__medal-gamemodesection");
        checkSection(".medals__medal-section");
    }
}