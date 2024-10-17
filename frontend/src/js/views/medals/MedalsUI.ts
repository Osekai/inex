import {Medal} from "./Medal";
import {MedalData} from "./MedalData";
import {AntheraIcon, Button, Div, LucideIcon, Text, TextArea} from "../../utils/dom";
import {getAverageRGB, rgbToHsl} from "../../utils/colour";
import {marked} from "marked";
import CommentsSection from "../../elements/comments-section";
import {DoRequest} from "../../utils/requests";
import {GetMod} from "../../utils/osu/mods";
import {TimeTransform_MM_SS} from "../../utils/time";
import {createDropdown} from "../../ui/ultra-dropdown";
import {Modal, ModalButton, ModalIcon, Overlay} from "../../ui/overlay";
import {PushToast} from "../../ui/toasts";
import {reportOverlay} from "../../ui/reportOverlay";
import {LoaderOverlay} from "../../ui/loader-overlay";
import {PermissionChecker} from "../../utils/permissionChecker";
import {CenteredLoader} from "../../utils/loaderUtils";


export class MedalsUI {
    // @ts-ignore
    static AddBeatmap(beatmap, grid) {
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
        extrabutton.classList.add("square")
        extrabutton.appendChild(LucideIcon("ellipsis"));


        var extrabutton_dropdown = Div("div", "dropdown-content");
        grid.appendChild(extrabutton_dropdown);

        createDropdown(extrabutton, extrabutton_dropdown);

        var report = Button("Report", "icon-button");
        extrabutton_dropdown.appendChild(report);
        report.addEventListener("click", () => {
            reportOverlay("Report " + beatmap.Song_Title, async (value : string) => {
                await DoRequest("POST", `/api/medals/beatmaps/${beatmap.ID}/report`, {
                    // @ts-ignore
                    "reporter_name": userData.username,
                    // @ts-ignore
                    "reporter_id": userData.id,
                    "reason": value
                })
                PushToast({
                    "theme": "success",
                    content: "Thanks for the report! We'll look into it soon!"
                })
            })
        })
        report.prepend(LucideIcon("triangle-alert"));


        var del = async (admin = false) => {
            var modal = new Modal("Are you sure you want to delete this post?", "This cannot be undone!", [new ModalButton("Delete", async () => {
                var url  =`/api/medals/beatmaps/${beatmap.ID}/` + (admin == true ? "admindelete" : "delete");
                var loader = new LoaderOverlay("Deleting");
                var r = await DoRequest('POST', url);
                loader.overlay.remove();
                if (r.success) {
                    outer.remove();
                } else {
                    PushToast({
                        theme: "error",
                        content: r.message
                    })
                }
                modal.overlay.remove();
            }), new ModalButton("Cancel", () => {
                modal.close();
            })], new ModalIcon("alert-triangle", "#ff623e"));
        }
        // @ts-ignore
        if(loggedIn && beatmap.Beatmap_Submitted_User_ID === userData.id) {
            var _delete = Button("Delete", "warning icon-button");
            extrabutton_dropdown.appendChild(_delete);
            _delete.prepend(LucideIcon("trash"));
            _delete.addEventListener("click", async () => {
                await del();
            });
        }
        if(PermissionChecker("medals.beatmaps.delete.any")) {
            var adm_delete = Button("AdminDelete", "warning icon-button");

            extrabutton_dropdown.appendChild(adm_delete);
            adm_delete.prepend(LucideIcon("zap"));
            adm_delete.addEventListener("click", async () => {
                await del(true);
            });
        }

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

        visitButton.target = "_blank";

        packDiv_right.appendChild(downloadButton);
        packDiv_right.appendChild(visitButton);

        return packDiv;
    }

    static LoadBeatmaps(medal: Medal) {
        var beatmapGrid = document.getElementById("medal_beatmaps");
        beatmapGrid.innerHTML = "";

        if (medal.Is_Restricted == 1) {
            document.getElementById("medal_beatmaps_add").classList.add("hidden");
        } else {
            document.getElementById("medal_beatmaps_add").classList.remove("hidden");
        }

        if (medal.Beatmaps !== null) {
            if (medal.BeatmapsType == "packs") {
                document.getElementById("medal_beatmaps_add").classList.add("hidden");
            }
            // @ts-ignore
            for (var beatmap of medal.Beatmaps) {
                if (medal.BeatmapsType == "beatmaps")
                    beatmapGrid.appendChild(MedalsUI.AddBeatmap(beatmap, beatmapGrid));
                if (medal.BeatmapsType == "packs")
                    beatmapGrid.appendChild(MedalsUI.AddPack(beatmap));
            }
            // @ts-ignore
            if (medal.Beatmaps.length < 3) {
                beatmapGrid.classList.add("large");
            } else {
                beatmapGrid.classList.remove("large");
            }

            // @ts-ignore
            if(medal.Beatmaps.length == 0 && medal.Is_Restricted == 1) {
                document.getElementById("medal_beatmaps_panel").classList.add("hidden");
            } else {
                document.getElementById("medal_beatmaps_panel").classList.remove("hidden");
            }
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
        document.getElementById("medal-home").classList.add("_hidden");
        document.getElementById("medal-info").classList.remove("_hidden");


        // @ts-ignore
        document.getElementById("medal_beatmaps").innerHTML = "";
        document.getElementById("medal_beatmaps").appendChild(CenteredLoader());

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


        if (medal.Solution !== null) {
            // @ts-ignore
            document.getElementById("medal_solution").innerHTML = marked.parse(medal.Solution);
        } else {
            document.getElementById("medal_solution").innerHTML = "Unknown";
        }




        function setSupport(type : string, support : number) {
            var el = document.getElementById("support-"+ type);
            var icon = el.querySelector("[icon]");
            icon.innerHTML = "";

            if(support == 1) {
                el.classList.remove("unsupported");
                icon.appendChild(LucideIcon("check"));
            } else {
                el.classList.add("unsupported");
                icon.appendChild(LucideIcon("x"));
            }
        }
        setSupport("stable", medal.Supports_Stable);
        setSupport("lazer", medal.Supports_Lazer);

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