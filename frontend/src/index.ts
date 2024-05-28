import {createLazyLoadInstance} from "./js/utils/lazyload";

// @ts-ignore
window.loader = createLazyLoadInstance();

import './style.css'
// @ts-ignore
export * from './js/external.js';
export * from './js/utils/usersettings.js';
export * from './js/ui/easyselector.js';
// @ts-ignore
export * from './js/ui/dropdown.js';
export * from './js/ui/overlay.js';
export * from './js/ui/toasts.js';
export * from './js/elements.js';
export * from './js/ui/otabs.js';
export * from "./js/utils/array.js";
export * from "./js/graphics/gradient-block.js";

import { siDiscord, siTwitter, siTwitch, siPatreon, siGithub, siYoutube, siOsu } from 'simple-icons';
const simpleicons = [siDiscord, siTwitter, siTwitch, siPatreon, siGithub, siYoutube, siOsu];

import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'

var aCreateIcons: () => void = null;


import("lucide").then(({createIcons, icons}) => {
    console.log(icons);
    aCreateIcons = function () {
        createIcons({
            icons
        });
        for (var element of document.querySelectorAll("[data-lucide]")) {
            element.removeAttribute("data-lucide");
        }


        for (let element of document.querySelectorAll("[simple-icon]")) {
            for (var icon of simpleicons) {
                console.log(icon);
                if (icon.slug.toLowerCase() === element.getAttribute("simple-icon")) {
                    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svg.setAttribute("viewBox", "0 0 24 24"); // Set viewBox attribute for SVG sizing

                    svg.setAttribute("width", "24");
                    svg.setAttribute("height", "24");

                    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("d", icon["path"]); // Set the 'd' attribute with path data
                    path.setAttribute("fill", "currentColor"); // Set the fill color to currentColor

                    svg.appendChild(path); // Append the path to the SVG element
                    element.replaceWith(svg); // Replace the original element with the created SVG
                    break;
                }
            }
            element.removeAttribute("simple-icon");
        }
    }
    aCreateIcons();
});

document.addEventListener("DOMContentLoaded", () => {
    console.log("%cAnthera Started!", "font-family:cursive;font-weight:900;border-left:2px solid #0f6;background:#333;color:#0f6;font-size:15px;padding:6px;border-radius:10px;");
    console.log("best not to paste anything in here if you don't know what it is :)")
    console.log(`    ▒▒▒    ▓▓
    ▓▒▒▒▒▒  ▓▓▓▓
     ▓▒▒▒▒▒ ▓▓▓▓     beep!
      ▓▒▒▒▒▓█▒▒▒▓▓
      █▓▒▒▒▒▒▒░░░░▒▓▓
       ▓▒▒▒▒▒░███████░░
      ▓▒▒▒▒▒░█████▓████░░
      ▓▒▒▒▒▒░██  ██▓█████░
      ▓▒▒▒▒░░█▌▐▌▐████████░
      ▓▒▒▒░ ░█████████████░
      ▓▒▒▒▓░░░████ ██▀▀██▀█
      █▓▒▒▒▓▓░░████▄ ▄█▄ ▄▓
      █▓▒▒▒▒▒▓▓░░▒▓▓▓▓▓▓▓
       █▓▒▒▒▒▒▒▓██████`)

    if (aCreateIcons != null) aCreateIcons();


    var targetNode = document.body;
    var config = {
        childList: true, subtree: true
    };
    var callback = function () {
        if (aCreateIcons != null) aCreateIcons();
        for (var element of document.querySelectorAll("[tooltip]")) {
            var text = element.getAttribute("tooltip");
            tippy(element, {
                content: text
            });
            element.removeAttribute("tooltip");
        }
        // @ts-ignore
        window.loader.update();
    };
    callback();
    var observer = new MutationObserver(callback);
    observer.observe(targetNode, config);

    // @ts-ignore
    window.loader.update();
})

