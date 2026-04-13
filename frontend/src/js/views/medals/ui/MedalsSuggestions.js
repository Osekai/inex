import {D2} from "../../../utils/d2";
import {DoRequest} from "../../../utils/requests";
import {MedalData} from "../MedalData";
import {getAverageRGB, rgbToHsl} from "../../../utils/colour";
import {marked} from "marked";
import {MedalsUI} from "../MedalsUI";

export class MedalsSuggestions {
    categorized = {};

    async Load() {
        let grid = document.getElementById("recommendations-grid");
        if(!loggedIn) {
            grid.innerHTML = "";
            grid.classList.add("not-enough");
            grid.appendChild(D2.LucideIcon("frown"));
            grid.appendChild(D2.Text("h1", "Log in to get medal recommendations!"));
            grid.appendChild(D2.Text("p", "We'll check what medals you have, and find which ones would be best to go for next"));
            grid.appendChild(D2.Link("Log in", "button cta", "/login"))
            return;
        }
        if(userData.user_achievements.length < 60) {
            grid.innerHTML = "";
            grid.classList.add("not-enough");
            grid.appendChild(D2.LucideIcon("frown"));
            grid.appendChild(D2.Text("h1", "Not enough medals to show recommendations"));
            grid.appendChild(D2.Text("p", "Get 60 medals first, and then we'll have some to show you!"));
            return;
        }
        let suggestions = await DoRequest("POST", "/api/medals/suggestions");
        grid.innerHTML = "";
        for(let suggestion of suggestions.content) {
            let medal = await MedalData.GetMedalFromID(suggestion.Medal)
            console.log(medal);

            let img, solution;

            let button = D2.Div("medal-suggestion col-reset", () => {
                D2.Div("info", () => {
                    img = D2.Image("", "/assets/osu/web/" + medal.Link);
                    D2.Div("", () => {
                        D2.Text("h1", medal.Name);
                        D2.Text("h2", medal.Description);
                        let instructions = D2.Text("h3", "")
                        instructions.innerHTML = medal.Instructions;
                    })
                })
                solution = D2.Div("markdown medal__info-solution", () => {

                })
            })
            solution.innerHTML = marked.parse(medal.Solution)
            img.onload = () => {
                var rgb = getAverageRGB(img);
                var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                button.style.setProperty("--hue", hsl[0] * 360);
                button.style.setProperty("--sat", hsl[1] * 3);
            };
            grid.appendChild(button);
            button.addEventListener("click", () => {
                MedalsUI.LoadMedalQuick(medal);
            })
        }
    }
}