import {AntheraIcon, Div, Image, Text} from "../../../utils/dom";
import {Misc} from "../../../utils/misc";
import {Medal} from "../Medal";
import {MedalData} from "../MedalData";
import {MedalsUI} from "../MedalsUI";
import {SetMedal} from "../../medals";
import {GamemodeToName} from "../../../utils/gamemode";

String.prototype.includes_nl = function(text) {
    return this.toLowerCase().includes(text.toLowerCase());
}

export class MedalsSidebar {
    categorized = {};
    InitializeCategory(full, cat) {
        full[cat] = {"all": [], "osu": [], "taiko": [], "catch": [], "mania": []};
    }


    Search(text) {
        var exact = false;
        if(text.startsWith("\"") && text.endsWith("\"")) {
            exact = true;
            text = text.substring(1, text.length-1);
        }
        text = text.replace('"', '');
        for (let medal of Object.values(MedalData.GetMedalsSync())) {
            var show = false;
            if(medal.Name.includes_nl(text)) {
                show = true;
            }
            if(!exact) {
                if(medal.Description.includes_nl(text)) {
                    show = true;
                }
                if(medal.Instructions != null && medal.Instructions.includes_nl(text)) {
                    show = true;
                }
            }

            if(show) {
                medal.Button.classList.remove("hidden");
                medal.Button.classList.add("visible");
            } else {
                medal.Button.classList.add("hidden");
                medal.Button.classList.remove("visible");
            }
        }

        function checkSection(classname) {
            for(var sect of document.querySelectorAll(classname)) {
                if(sect.querySelectorAll(".visible").length === 0) {
                    sect.classList.add("hidden");
                } else {
                    sect.classList.remove("hidden");
                }
            }
        }
        checkSection(".medals__medal-grid");
        checkSection(".medals__medal-gamemodesection");
        checkSection(".medals__medal-section");


        if(document.getElementById("sidebar").querySelectorAll(".visible").length === 0) {
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

            if(medal.Obtained) medalButton.classList.add("obtained");

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

        gamemodecategorydiv.classList.add("gamemode-"+name);
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
        this.Search(searchbar.value);

    }
}