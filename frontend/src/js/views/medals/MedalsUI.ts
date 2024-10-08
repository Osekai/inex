import {Medal} from "./Medal";
import {MedalData} from "./MedalData";
import {AntheraIcon, Div, LucideIcon, Text} from "../../utils/dom";
import {getAverageRGB, rgbToHsl} from "../../utils/colour";
import {marked} from "marked";
import CommentsSection from "../../elements/comments-section";
import {DoRequest} from "../../utils/requests";
import {GetMod} from "../../utils/osu/mods";
import {TimeTransform_MM_SS} from "../../utils/time";


export class MedalsUI {
    // @ts-ignore
    static AddBeatmap(beatmap) {
        var outer = Div("div", "beatmap");

        var top = Div("a", "top");
        var top_top = Div("div", "top-top");
        var top_bottom = Div("div", "top-bottom");
        top.appendChild(top_top);
        top.appendChild(top_bottom);

        (<HTMLAnchorElement>top).href = `https://osu.ppy.sh/b/${beatmap.Beatmap_ID}`;
        (<HTMLAnchorElement>top).target = "_blank";

        top_top.appendChild(Text("h3", beatmap.Song_Artist));
        top_bottom.appendChild(Text("h1", beatmap.Song_Title));

        top_top.appendChild(Text("h1", beatmap.Difficulty_Name));
        top_bottom.appendChild(Text("h3", "mapped by " + beatmap.Mapper_Name));

        outer.appendChild(top);

        var bottom = Div("div", "bottom");

        //var submissiondate = Text("h4", timeAgo.format(new Date(beatmap.Beatmap_Submitted_Date)));
        //bottom.appendChild(submissiondate);
        //submissiondate.setAttribute("tooltip", beatmap.Beatmap_Submitted_Date);

        var note = Text("h4", beatmap.Note);
        bottom.appendChild(note);

        note.addEventListener("click", () => {
            note.classList.toggle("expanded");
        })

        var votebutton = Div("div", "pill-button")
        bottom.appendChild(votebutton);
        votebutton.classList.add("vote-button")
        votebutton.innerText = beatmap.VoteCount;

        if (beatmap.HasVoted === 1) votebutton.classList.add("active");

        votebutton.addEventListener("click", async () => {
            votebutton.classList.add("loading");
            var data = await DoRequest("POST", "/api/vote/Medals_Beatmaps/" + beatmap.ID)
            if (data.message === "vote_add") {
                votebutton.classList.add("active");
                beatmap.VoteCount++;
            } else if (data.message === "vote_remove") {
                votebutton.classList.remove("active");
                beatmap.VoteCount--;
            }
            votebutton.innerText = beatmap.VoteCount;
            votebutton.classList.remove("loading");
        })

        var extrabutton = Div("div", "pill-button")
        bottom.appendChild(extrabutton);
        bottom.classList.add("square")
        extrabutton.appendChild(LucideIcon("ellipsis"));


        outer.appendChild(bottom);

        outer.style.setProperty("--bg", "url(\"https://assets.ppy.sh/beatmaps/" + beatmap.Beatmapset_ID + "/covers/cover.jpg\")")

        return outer;
    }

    static AddPack(pack: any) {
        var packDiv = Div("div", "gamemode-" + pack.Gamemode);
        packDiv.classList.add("pack");
        packDiv.classList.add("col-reset");

        packDiv.appendChild(AntheraIcon("icon-gamemode-" + pack.Gamemode))
        var packDiv_main = Div("div", "main");
        var packDiv_left = Div("div", "left");
        var packDiv_right = Div("div", "right");
        packDiv_main.appendChild(packDiv_left);
        packDiv_main.appendChild(packDiv_right);
        packDiv.appendChild(packDiv_main);


        packDiv_left.appendChild(Text("h1", pack.Name))
        var info = Div();
        packDiv_left.appendChild(info);
        info.appendChild(Text("h3", pack.Maps_Count + " maps"))
        info.appendChild(Text("p", TimeTransform_MM_SS(pack.Maps_Length)))

        var downloadButton: HTMLAnchorElement = <HTMLAnchorElement>Div("a");
        var visitButton: HTMLAnchorElement = <HTMLAnchorElement>Div("a");

        downloadButton.appendChild(LucideIcon("download"))
        visitButton.appendChild(LucideIcon("external-link"))

        downloadButton.href = pack.Link;
        visitButton.href = "https://osu.ppy.sh/beatmaps/packs/" + pack.Pack_ID;

        packDiv_right.appendChild(downloadButton);
        packDiv_right.appendChild(visitButton);

        return packDiv;
    }

    static LoadBeatmaps(medal: Medal) {
        var beatmapGrid = document.getElementById("medal_beatmaps");
        beatmapGrid.innerHTML = "";
        var beatmapGrid = document.getElementById("medal_beatmaps");
        // @ts-ignore
        for (var beatmap of medal.Beatmaps) {
            if (medal.BeatmapsType == "beatmaps")
                beatmapGrid.appendChild(MedalsUI.AddBeatmap(beatmap));
            if (medal.BeatmapsType == "packs")
                beatmapGrid.appendChild(MedalsUI.AddPack(beatmap));
        }
        // @ts-ignore
        if (medal.Beatmaps.length < 3) {
            beatmapGrid.classList.add("large");
        } else {
            beatmapGrid.classList.remove("large");
        }
    }

    static CheckObtainedFilter() {
        // @ts-ignore
        if (!loggedIn) return;
        if (MedalData.ObtainedFilterActive()) {
            document.getElementById("medal-page").classList.add("filter-obtained");
            document.getElementById("filter-button").classList.add("active");
        } else {
            document.getElementById("medal-page").classList.remove("filter-obtained");
            document.getElementById("filter-button").classList.remove("active");
        }
    }

    static LoadMedal(medal: Medal, scrollTo = false) {
        // @ts-ignore
        document.getElementById("medal_beatmaps").innerHTML = loader;
        if (medal.Is_Restricted == 1) {
            document.getElementById("medal_beatmaps_add").classList.add("hidden");
        } else {
            document.getElementById("medal_beatmaps_add").classList.remove("hidden");
        }
        MedalData.LoadExtra(medal, {
            "beatmaps": this.LoadBeatmaps
        });
        (<CommentsSection>document.getElementById("comments")).loadComments(medal.Medal_ID);

        if (scrollTo) {
            document.querySelector("[medal-button-id='" + medal.Medal_ID + "']").scrollIntoView({
                "behavior": "smooth",
                "block": "center"
            });
        }

        var img: HTMLImageElement = <HTMLImageElement>document.getElementById("medal_image");
        img.src = "/assets/osu/web/" + medal.Link;
        img.onload = () => {
            var rgb = getAverageRGB(img);
            var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            // @ts-ignore
            document.getElementById("main-col").style.setProperty("--hue", hsl[0] * 360);
            // @ts-ignore
            document.getElementById("main-col").style.setProperty("--sat", hsl[1] * 3);
        };

        document.getElementById("medal_name").innerText = medal.Name;
        document.getElementById("medal_description").innerText = medal.Description;
        document.getElementById("medal_instructions").innerHTML = medal.Instructions; // instructions have <i> sometimes


        if(medal.Solution !== null) {
            // @ts-ignore
            document.getElementById("medal_solution").innerHTML = marked.parse(medal.Solution.replace(/\n/g, "<br />"));
        } else {
            document.getElementById("medal_solution").innerHTML = "Unknown";
        }
        var mods = document.getElementById("mods");
        mods.classList.add("hidden");
        mods.innerHTML = "";
        console.log(medal);
        if (medal.Mods !== null) {
            for (var mod of medal.Mods.split(",")) {
                mods.classList.remove("hidden");
                var modinfo = GetMod(mod);

                var pill = Div("div", "mod-pill");
                pill.classList.add(modinfo.Type)
                var icon = AntheraIcon("mod-" + mod);

                pill.appendChild(icon);
                pill.appendChild(Text("p", mod));
                pill.setAttribute("tooltip", modinfo.Name);

                mods.appendChild(pill);
            }
        }
    }

}

MedalsUI.CheckObtainedFilter();