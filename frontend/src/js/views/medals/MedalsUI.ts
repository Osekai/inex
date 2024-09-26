import {Medal} from "./Medal";
import {MedalData} from "./MedalData";
import {Div, Text} from "../../utils/dom";
import {getAverageRGB, rgbToHsl} from "../../utils/colour";
import {marked} from "marked";
import CommentsSection from "../../elements/comments-section";






export class MedalsUI {
    // @ts-ignore
    static AddBeatmap(beatmap) {
        var beatmapGrid = document.getElementById("medal_beatmaps");

        var outer = Div("div", "beatmap");

        var top = Div("a", "top");
        var top_top = Div("div", "top-top");
        var top_bottom = Div("div", "top-bottom");
        top.appendChild(top_top);
        top.appendChild(top_bottom);

        console.log(beatmap);
        (<HTMLAnchorElement>top).href = `https://osu.ppy.sh/b/${beatmap.Beatmap_ID}`;
        (<HTMLAnchorElement>top).target = "_blank";

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
        var beatmapGrid = document.getElementById("medal_beatmaps");
        beatmapGrid.innerHTML = "";
        // @ts-ignore
        for (var beatmap of medal.Beatmaps) {
            MedalsUI.AddBeatmap(beatmap);
        }
    }

    static LoadMedal(medal: Medal, scrollTo = false) {
        // @ts-ignore
        document.getElementById("medal_beatmaps").innerHTML = loader;
        MedalData.LoadExtra(medal, {
            "beatmaps": this.LoadBeatmaps
        });
        (<CommentsSection>document.getElementById("comments")).loadComments(medal.Medal_ID);

        if(scrollTo) {
            document.querySelector("[medal-button-id='"+medal.Medal_ID+"']").scrollIntoView({
                "behavior": "smooth",
                "block": "center"
            });
        }

        var img : HTMLImageElement = <HTMLImageElement>document.getElementById("medal_image");
        img.src = "/assets/osu/web/" + medal.Link;
        img.onload = () => {
            var rgb = getAverageRGB(img);
            var hsl = rgbToHsl(rgb.r,rgb.g,rgb.b);
            // @ts-ignore
            document.getElementById("main-col").style.setProperty("--hue", hsl[0]*360);
            // @ts-ignore
            document.getElementById("main-col").style.setProperty("--sat", hsl[1]*3);
        };

        document.getElementById("medal_name").innerText = medal.Name;
        document.getElementById("medal_description").innerText = medal.Description;
        document.getElementById("medal_instructions").innerHTML = medal.Instructions; // instructions have <i> sometimes


        // @ts-ignore
        document.getElementById("medal_solution").innerHTML = marked.parse(medal.Solution.replace(/\n/g, "<br />"));
    }

}