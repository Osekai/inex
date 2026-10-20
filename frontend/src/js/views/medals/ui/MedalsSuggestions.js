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
        let loaded = false;

        let loaderTexts = document.getElementById("loader-funny-text");
        let getMessage = () => {
            if(loaded == true) return;
            let funny = [
                "Matching Hexagons...",
                "Finding the best match for you...",
                "Your medal date awaits...",
                "Checking your best scores...",
                "Checking your worst scores...",
                "Fun awaits!",
                "Finding your least favourite medals...",
                "Planning your medal getaway",
                "This is hard..."
            ]
            loaderTexts.prepend(D2.Text("h1", funny[Math.floor(Math.random() * funny.length)]));
            let offset = 0;
            for(let child of loaderTexts.children) {
                child.style.setProperty("--offset", offset);
                offset++;
            }
        }
        let loop = setInterval(() => {
            getMessage();
        }, 3600);
        getMessage();

        let suggestions = await DoRequest("POST", "/api/medals/suggestions");
        if(!suggestions.success) {
            loaded = true;
            grid.innerHTML = "";
            grid.classList.add("not-enough");
            grid.appendChild(D2.LucideIcon("frown"));
            grid.appendChild(D2.Text("h1", "No recommendations yet"));
            grid.appendChild(D2.Text("p", suggestions.message));
            return;
        }
        grid.innerHTML = "";
        let offset = 0;
        for(let suggestion of suggestions.content) {
            let medal = await MedalData.GetMedalFromID(suggestion.Medal)

            let img, solution;

            let button = D2.Div("medal-suggestion col-reset", () => {
                D2.Div("info", () => {
                    img = D2.Image("", "/assets/medals/web/" + medal.Link);
                    D2.Div("", () => {
                        D2.Text("h1", medal.Name);
                        D2.Text("h2", medal.Description);
                        let instructions = D2.Text("h3", "")
                        instructions.innerHTML = medal.Instructions;
                    })
                })
                solution = D2.Div("medal__info-solution", () => {

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
            button.style.setProperty("--offset", offset);
            offset++;
        }
    }
}