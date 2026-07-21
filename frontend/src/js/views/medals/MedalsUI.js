// @flow
import {Medal} from "./Medal";
import {MedalData} from "./MedalData";
import {AntheraIcon, Div, LucideIcon, Text} from "../../utils/dom";
import {marked} from "marked";
import {DoRequest} from "../../utils/requests";
import {GetMod} from "../../utils/osu/mods";
import {TimeTransform_MM_SS, UTCify} from "../../utils/time";
import {createDropdown} from "../../ui/ultra-dropdown";
import {Modal, ModalButton, ModalIcon} from "../../ui/overlay";
import {PushToast} from "../../ui/toasts";
import {reportOverlay} from "../../ui/reportOverlay";
import {LoaderOverlay} from "../../ui/loader-overlay";
import {PermissionChecker} from "../../utils/permissionChecker";
import {CenteredLoader} from "../../utils/loaderUtils";
import {timeAgo} from "../../utils/timeago";
import {SetMedal} from "../medals";
import {D2} from "../../utils/d2";
import {Graph} from "../../ui/graph";
import TimeAgo from "javascript-time-ago";


export class MedalsUI {
    static extra_AdoptionGraph = null;

    static AddBeatmap(beatmap, grid) {
        var votebutton, extrabutton, dropdown;

        let today = new Date();
        let submitted = UTCify(beatmap.Beatmap_Submitted_Date);

        let months = (today.getFullYear() - submitted.getFullYear()) * 12
            + (today.getMonth() - submitted.getMonth());

        let outdated = months > 36;

        var del = async (admin = false) => {
            var modal = new Modal("Are you sure you want to delete this post?", "This cannot be undone!", [
                new ModalButton("Delete", async () => {
                    var url = `/api/medals/beatmaps/${beatmap.ID}/` + (admin === true ? "admindelete" : "delete");
                    var loader = new LoaderOverlay("Deleting");
                    var r = await DoRequest('POST', url);
                    loader.overlay.remove();
                    if (r.success) {
                        outer.remove();
                    } else {
                        PushToast({
                            theme: "error",
                            content: r.message
                        });
                    }
                    modal.overlay.remove();
                }),
                new ModalButton("Cancel", () => {
                    modal.close();
                })
            ], new ModalIcon("alert-triangle", "#ff623e"));
        };

        var outer = D2.Div("beatmap", () => {
            if(outdated) {
                console.log("old lol");
                D2.Div("outdated", () => {
                    D2.Icon("alert-triangle", "warning");
                    D2.Text("p", "This beatmap was submitted " + timeAgo.format(submitted) + ". It may not work anymore!")
                });
            }

            D2.DivLink(`https://osu.ppy.sh/b/${beatmap.Beatmap_ID}`, "top", () => {
                D2.Div("top-top", () => {
                    D2.Text("h3", beatmap.Song_Artist);
                    D2.Text("h1", beatmap.Difficulty_Name);
                });
                D2.Div("top-bottom", () => {
                    D2.Text("h1", beatmap.Song_Title);
                    D2.Text("h3", "mapped by " + beatmap.Mapper_Name);
                });
            }).target = "_blank";

            D2.Div("bottom", () => {
                var note = D2.Text("h4", beatmap.Note);
                note.addEventListener("click", () => {
                    note.classList.toggle("expanded");
                });

                votebutton = D2.Div("pill-button vote-button", beatmap.VoteCount.toString());
                if (beatmap.HasVoted === 1) votebutton.classList.add("active");
                votebutton.addEventListener("click", async () => {
                    votebutton.classList.add("loading");
                    var data = await DoRequest("POST", "/api/vote/Medals_Beatmaps/" + beatmap.ID);
                    if (data.message === "vote_add") {
                        votebutton.classList.add("active");
                        beatmap.VoteCount++;
                    } else if (data.message === "vote_remove") {
                        votebutton.classList.remove("active");
                        beatmap.VoteCount--;
                    }
                    votebutton.innerText = beatmap.VoteCount;
                    votebutton.classList.remove("loading");
                });

                D2.DivLink(`osu://b/${beatmap.Beatmap_ID}`, "pill-button square dark", () => {
                    D2.LucideIcon("download");
                });

                extrabutton = D2.Div("pill-button dark square", () => {
                    D2.LucideIcon("ellipsis");
                });
            });

            dropdown = D2.Div("dropdown-content", () => {

                try {
                    if (beatmap.User !== null && beatmap.User.Username !== "")
                        D2.DivLink(`https://osu.ppy.sh/u/${beatmap.User.User_ID}`, "uploader", () => {
                            console.log(beatmap);
                            D2.Image("img", "https://a.ppy.sh/" + beatmap.User.User_ID);
                            D2.Div("", () => {

                                D2.StyledText("h3", `Submitted by <strong>${beatmap.User.Username}</strong>`);
                                D2.Text("p", timeAgo.format(new Date(UTCify(beatmap.Beatmap_Submitted_Date))));
                            })
                        })
                } catch {
                    // TODO: worakround for cras, actually check this later
                }
                if (loggedIn && beatmap.Beatmap_Submitted_User_ID === userData.id) {
                    let del = D2.CustomPlus("button", "button  icon-button", {}, () => {
                        D2.LucideIcon("trash");
                        D2.Text("span", "Delete");
                    });
                    del.addEventListener("click", async () => {
                        await del();
                    });
                }

                let report = D2.CustomPlus("button", "button icon-button", {}, () => {
                    D2.LucideIcon("triangle-alert");
                    D2.Text("span", "Report");
                });
                report.addEventListener("click", () => {
                    reportOverlay("Report " + beatmap.Song_Title, async (value) => {
                        await DoRequest("POST", `/api/medals/beatmaps/${beatmap.ID}/report`, {
                            "reporter_name": userData.username,
                            "reporter_id": userData.id,
                            "reason": value
                        });
                        PushToast({
                            "theme": "success",
                            content: "Thanks for the report! We'll look into it soon!"
                        });
                    });
                });

                if (PermissionChecker("medals.beatmaps.delete.any")) {
                    let adm_delete = D2.CustomPlus("button", "button icon-button", {}, () => {
                        D2.LucideIcon("zap");
                        D2.Text("span", "AdminDelete");
                    });
                    adm_delete.addEventListener("click", async () => {
                        await del(true);
                    });
                }
            })

            createDropdown(extrabutton, dropdown);
        });



        outer.style.setProperty("--bg", "url(\"https://assets.ppy.sh/beatmaps/" + beatmap.Beatmapset_ID + "/covers/cover.jpg\")");

        return outer;
    }

    static AddPack(pack) {
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

        var downloadButton = Div("a");
        var visitButton = Div("a");

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

            for (var beatmap of medal.Beatmaps) {
                if (medal.BeatmapsType == "beatmaps")
                    beatmapGrid.appendChild(MedalsUI.AddBeatmap(beatmap, beatmapGrid));
                if (medal.BeatmapsType == "packs")
                    beatmapGrid.appendChild(MedalsUI.AddPack(beatmap));
            }

            if (medal.Beatmaps.length < 3) {
                beatmapGrid.classList.add("large");
            } else {
                beatmapGrid.classList.remove("large");
            }


            if (medal.Beatmaps.length == 0 && medal.Is_Restricted == 1) {
                document.getElementById("medal_beatmaps_panel").classList.add("hidden");
            } else {
                document.getElementById("medal_beatmaps_panel").classList.remove("hidden");
            }
        }
    }

    static async LoadExtra(medal: Medal) {
        MedalsUI.extra_AdoptionGraph?.remove();

        let extraData = await DoRequest("GET", `/api/medals/${medal.Medal_ID}/extra`);
        console.log("???", extraData);

        let adoptionGraphContainer = document.getElementById("medal_adoption_graph");
        adoptionGraphContainer.innerHTML = "";
        let adoptionData = [];

        let maxAdoption = 0;
        for (let adopt of extraData.content.Graphs.Adoption) {
            if (adopt.Total > maxAdoption) maxAdoption = adopt.Total;
        }
        let offset = medal.Count_Achieved_By / maxAdoption;

        for (let adopt of extraData.content.Graphs.Adoption) {
            adoptionData.push({
                date: adopt.Date,
                value: Math.round(adopt.Total * offset),
                earned: Math.round(adopt.Users_Earned * offset)
            })
        }
        MedalsUI.extra_AdoptionGraph = new Graph(adoptionGraphContainer);


        MedalsUI.extra_AdoptionGraph.renderTooltip = d => `<small>${d.date}</small><h1>${d.value} users (+${d.earned})</h1>`;
        MedalsUI.extra_AdoptionGraph.H = 150;
        MedalsUI.extra_AdoptionGraph.load(adoptionData);

        document.getElementById("medal_adoption_users").innerText = medal.Count_Achieved_By;
    }

    static CheckObtainedFilter() {

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


        document.getElementById("medal_beatmaps").innerHTML = "";
        document.getElementById("medal_beatmaps").appendChild(CenteredLoader());

        MedalData.LoadExtra(medal, {
            "beatmaps": this.LoadBeatmaps,
        });
        this.LoadExtra(medal); // no need to await, it'll be loaded in the background
        document.getElementById("comments").loadComments(medal.Medal_ID);

        if (scrollTo) {
            setTimeout(() => {
                if (document.querySelector("[medal-button-id='" + medal.Medal_ID + "']").classList.contains("hidden")) return;
                document.querySelector("[medal-button-id='" + medal.Medal_ID + "']").scrollIntoView({
                    "behavior": "smooth",
                    "block": "center"
                });
            }, 100)
        }

        var img = document.getElementById("medal_image");
        img.setAttribute("src", medal.Link);


        var img2 = document.getElementById("background-medal");
        img2.setAttribute("src", medal.Link);
        //img.onload = () => {
        //    var rgb = getAverageRGB(img);
        //    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        //    
        //    document.getElementById("main-col").style.setProperty("--hue", hsl[0] * 360);
        //    
        //    document.getElementById("main-col").style.setProperty("--sat", hsl[1] * 3);
        //};
        img.addEventListener("load", () => {
            let colours = img.getColour();

            document.getElementById("main-col").style.setProperty("--hue", colours[0] * 360);
            document.getElementById("main-col").style.setProperty("--sat", colours[1]);
        })

        document.getElementById("medal_name").innerText = medal.Name;
        document.getElementById("medal_description").innerText = medal.Description;
        document.getElementById("medal_instructions").innerHTML = medal.Instructions; // instructions have <i> sometimes

        console.log(medal);


        document.getElementById("medal_release_date_ago").innerText = timeAgo.format(new Date(medal.Date_Released));
        document.getElementById("medal_release_date").innerText = new Date(medal.Date_Released.replace(" 00:00:00", "")).toLocaleDateString();
        document.getElementById("medal_first_achieved_date").innerText = new Date(medal.First_Achieved_Date).toLocaleString();
        document.getElementById("medal_first_achieved_by").innerText = medal.First_Achieved_Username;
        document.getElementById("medal_first_achieved_by_pfp").src = "https://a.ppy.sh/" + medal.First_Achieved_User_ID;
        document.getElementById("medal_first_achieved_by_link").href = "https://osu.ppy.sh/u/" + medal.First_Achieved_User_ID;

        if (medal.Solution !== null) {

            document.getElementById("medal_solution").innerHTML = marked.parse(medal.Solution);
        } else {
            document.getElementById("medal_solution").innerHTML = "Unknown";
        }


        function setSupport(type, support) {
            var el = document.getElementById("support-" + type);
            var icon = el.querySelector("[icon]");
            icon.innerHTML = "";

            if (support == 1) {
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

    static LoadMedalQuick(medal) {
        SetMedal(medal.Medal_ID, true, true);
    }

    static Init() {
        let buttons = document.querySelectorAll("[medal-button]");
        for (let button of buttons) {
            button.addEventListener("click", () => {
                MedalsUI.LoadMedalQuick(button.getAttribute("medal-button"))
            })
        }

        const el = document.getElementById("medal_first_achieved_date");
        if (el) {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
            }, { capture: true });
        }
    }
}

MedalsUI.CheckObtainedFilter();