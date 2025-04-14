import {createLazyLoadInstance} from "./js/utils/lazyload";
import './style.css'
import {siDiscord, siGithub, siOsu, siPatreon, siTwitch, siTwitter, siYoutube} from 'simple-icons';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'
import {RoleBadge} from "./js/utils/dom";
import {GetSetting, SetSettings} from "./js/utils/usersettings";


window.loader = createLazyLoadInstance();

export * from './js/external.js';
export * from './js/utils/usersettings.js';
export * from './js/ui/easyselector.js';
export * from './js/ui/dropdown.js';
export * from './js/ui/overlay.js';
export * from './js/ui/toasts.js';
export * from './js/elements.js';
export * from './js/ui/otabs.js';
export * from "./js/utils/array.js";
export * from "./js/graphics/gradient-block.js";

const simpleicons = [siDiscord, siTwitter, siTwitch, siPatreon, siGithub, siYoutube, siOsu];

var aCreateIcons = null;


import("lucide").then(({createIcons, icons}) => {
    aCreateIcons = function () {
        createIcons({
            icons
        });
        for (var element of document.querySelectorAll("[data-lucide]")) {
            element.removeAttribute("data-lucide");
        }


        for (let element of document.querySelectorAll("[simple-icon]")) {
            for (var icon of simpleicons) {
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
        window.loader.update();
    };
    callback();
    var observer = new MutationObserver(callback);
    observer.observe(targetNode, config);

    window.loader.update();
})

if (loggedIn) {
    var roles = userData.Roles;
    for (var role of roles) {
        document.getElementById("roles").appendChild(RoleBadge(role));
    }
}


for (var item of document.querySelectorAll("[setting-item]")) {
    var input = item.querySelector("input");
    var name = item.getAttribute("setting-item");

    if (input.type == "checkbox") {
        input.checked = GetSetting(name, false, true);
        input.addEventListener("change", () => {
            SetSettings(name, input.checked, true)
        })
    }
}