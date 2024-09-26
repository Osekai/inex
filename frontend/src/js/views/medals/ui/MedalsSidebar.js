import {AntheraIcon, Div, Image, Text} from "../../../utils/dom";
import {Misc} from "../../../utils/misc";
import {Medal} from "../Medal";
import {MedalData} from "../MedalData";
import {MedalsUI} from "../MedalsUI";
import {SetMedal} from "../../medals";
import {GamemodeToName} from "../../../utils/gamemode";

export class MedalsSidebar {
    categorized = {};
    InitializeCategory(full, cat) {
        full[cat] = {"all": [], "osu": [], "taiko": [], "catch": [], "mania": []};
    }


    RenderMedalGrid(medals) {
        var grid = Div("div", "medals__medal-grid");
        for (let medal of medals) {
            let medalButton = Div("button", "medals__medal-button");
            medalButton.append(Image(medal.Link, "", true))
            medalButton.setAttribute("tooltip", medal.Name)

            medalButton.setAttribute("medal-button-id", medal.Medal_ID);


            medalButton.addEventListener("click", () => {
                SetMedal(medal.Medal_ID, true);
            })

            grid.appendChild(medalButton);
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


    }
}