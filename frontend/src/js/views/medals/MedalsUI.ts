import {Medal} from "./Medal";
import {MedalData} from "./MedalData";
import {Div, Text} from "../../utils/dom";

export class MedalsUI {
    // @ts-ignore
    static AddBeatmap(beatmap) {
        console.log("Adding beatmap", beatmap);
        var beatmapGrid = document.getElementById("medal_beatmaps");

        var outer = Div("div", "beatmap");

        var top = Div("a", "top");
        var top_top = Div("div", "top-top");
        var top_bottom = Div("div", "top-bottom");
        top.appendChild(top_top);
        top.appendChild(top_bottom);

        top_top.appendChild(Text("h3", beatmap.Song_Artist));
        top_bottom.appendChild(Text("h1", beatmap.Song_Title));

        top_top.appendChild(Text("h1", beatmap.Difficulty_Name));
        top_bottom.appendChild(Text("h3", "mapped by " + beatmap.Mapper_Name));

        outer.appendChild(top);

        var bottom = Div("div", "bottom");

        bottom.appendChild(Text("h4", "submission date"));

        var votebutton = Div("div", "pill-button")
        bottom.appendChild(votebutton);
        votebutton.classList.add("vote-button")
        votebutton.innerText = beatmap.VoteCount;

        votebutton.addEventListener("click", () => {

        })

        outer.appendChild(bottom);

        outer.style.setProperty("--bg", "url(\"https://assets.ppy.sh/beatmaps/"+ beatmap.Beatmapset_ID +"/covers/cover.jpg\")")

        beatmapGrid.appendChild(outer);
    }
    static LoadBeatmaps(medal: Medal) {
        console.log("beatmaps are supposedly loaded for medal " + medal.Medal_ID);
        console.log(medal);
        var beatmapGrid = document.getElementById("medal_beatmaps");
        beatmapGrid.innerHTML = "";
        // @ts-ignore
        for (var beatmap of medal.Beatmaps) {
            MedalsUI.AddBeatmap(beatmap);
        }
    }

    static LoadMedal(medal: Medal) {
        MedalData.LoadExtra(medal, {
            "beatmaps": this.LoadBeatmaps
        });
        console.log(medal);

        (<HTMLImageElement>document.getElementById("medal_image")).src = medal.Link;

        document.getElementById("medal_name").innerText = medal.Name;
        document.getElementById("medal_description").innerText = medal.Description;
        document.getElementById("medal_instructions").innerHTML = medal.Instructions; // instructions have <i> sometimes

        document.getElementById("medal_solution").innerHTML = medal.Solution;
    }

}