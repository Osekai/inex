import {createLazyLoadInstance} from "./js/utils/lazyload";
import './style.css'
import {siDiscord, siGithub, siOsu, siPatreon, siTwitch, siTwitter, siYoutube} from 'simple-icons';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'
import {RoleBadge} from "./js/utils/dom";
import {GetSetting, OnChangeSetting} from "./js/utils/usersettings";
import {renderDebugTimings} from "./js/layout/debug";
import {InitDropdowns} from "./js/ui/dropdown";
import LoadMore from "./js/ui/notifications";
import {LoadOTabs} from "./js/ui/otabs";
import {D2} from "./js/utils/d2";
import {Navbar} from "./js/layout/navbar";
import {DoRequest} from "./js/utils/requests";
import {Clubs2} from "./js/utils/Clubs2";


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
export * from "./js/ui/aos.js"
const simpleicons = [
    siDiscord,
    siTwitter,
    siTwitch,
    siPatreon,
    siGithub,
    siYoutube,
    siOsu
];

var aCreateIcons = null;


import("lucide").then(({
                           createIcons,
                           icons
                       }) => {
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


let profileUrlList = [];


function profileUrls() {
    for (let element of document.querySelectorAll("a")) {
        if (profileUrlList.includes(element)) continue;
        if (element.hasAttribute("no-url-replace")) continue;
        let href = element.getAttribute("href");
        if (href == null) continue;
        if (href.startsWith("/profiles/")) {
            let split = href.split("/");
            if (split.length < 2) continue;
            let userId = split[2];
            console.log("link goes to " + userId);
            profileUrlList.push(element);
            element.target = "_blank";
            let update = () => {
                let value = GetSetting("global.profileLinks", "osekai", true);
                console.log(value);
                if (value === "osekai") {
                    element.setAttribute("href", "/profiles/" + userId);
                } else if (value === "osu") {
                    element.setAttribute("href", "https://osu.ppy.sh/users/" + userId);
                }
            }
            OnChangeSetting("global.profileLinks", (value) => {
                update();
            })
            update();

            if(element.hasAttribute("no-url-popup")) {
                continue;
            }

            // build the custom popup element
            let els = {};
            let popupContent = D2.CustomPlus("a", "profile-popup", {}, () => {
                els["header"] = D2.Div("profile-header", () => {
                    els["avatar"] = D2.Image("pfp");
                    els["name"] = D2.Text("h2");
                    els["flag"] = D2.Image("flag");
                })
                els["medals"] = D2.Div("profile-medals", () => {
                    D2.Div("", () => {
                        els["medals-percentage"] = D2.Text("p")
                        els["medals-clubname"] = D2.Text("h3")
                    })
                    els["medals-club"] = D2.Image("")
                })
            })


            tippy(element, {
                content: popupContent,
                allowHTML: false, // not needed since we're passing a DOM node
                interactive: true, // lets the mouse move onto the popup without it closing
                interactiveBorder: 10, // forgiving hover gap between the link and popup
                appendTo: () => document.body, // avoids clipping/overflow issues from parent containers
                placement: "top",
                delay: [
                    100,
                    0
                ], // slight delay before showing, instant hide
                onShow(instance) {
                    (async () => {
                        //await new Promise(resolve => setTimeout(resolve, 2000));
                        let data = await DoRequest("POST", "/api/profiles/quick/" + userId);
                        let profile = data.content;

                        popupContent.classList.add("loaded");

                        els["avatar"].src = "https://a.ppy.sh/" + profile.User_ID;
                        els["name"].innerText = profile.Name;
                        els["flag"].src = "/assets/flags/4x3/" + profile.Country_Code.toLowerCase() + ".svg";

                        let userMedals = profile.Count_Medals;
                        let percentage = ((userMedals / medals.content.length) * 100).toFixed(2);
                        els["medals-percentage"].innerText = `${percentage}% medals (${userMedals}/${medals.content.length})`;

                        let club = Clubs2.Get(percentage);
                        els["medals-club"].src = club.icon;
                        els["medals-clubname"].innerText = club.name;

                        els["medals"].classList.add(club.cssClass);

                        popupContent.href = "/profiles/" + userId;
                        popupContent.setAttribute("no-url-popup", "ok");
                    })();
                },
            });

            if(Math.random() < 0.1) {
                //element._tippy.show();
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (aCreateIcons != null) aCreateIcons();

    var targetNode = document.body;
    var config = {
        childList: true,
        subtree: true
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
        InitDropdowns();
        LoadOTabs();
        setTimeout(() => {
            profileUrls();
        }, 2)

    };
    callback();
    var observer = new MutationObserver(callback);
    observer.observe(targetNode, config);

    window.loader.update();
    InitDropdowns();

})

if (loggedIn) {
    var roles = userData.Roles;
    for (var role of roles) {
        document.getElementById("roles").appendChild(RoleBadge(role));
    }
}


/*for (var item of document.querySelectorAll("[setting-item]")) {
    var input = item.querySelector("input");
    var name = item.getAttribute("setting-item");

    if (input.type == "checkbox") {
        input.checked = GetSetting(name, false, true);
        input.addEventListener("change", () => {
            SetSettings(name, input.checked, true)
        })
    }
}*/
window.debug = renderDebugTimings;

let notifButton = document.getElementById("notif-button");
if (notifButton != null) {
    let notifOverlay = document.getElementById("notifications-overlay");
    notifButton.addEventListener("click", () => {
        setTimeout(() => {
            if (notifOverlay.classList.contains("jsdropdown-open")) {
                LoadMore();
            }
        }, 2)
    })
}

function InitializeAlerts() {
    let dismissed = JSON.parse(localStorage.getItem("dismissedAlerts"));
    if (dismissed == null) dismissed = {};

    for (let alert of alerts) {
        if (alert.id in dismissed) continue;
        let element = D2.Div("alert-item", () => {
            let content = D2.Custom("a", "alert-content", () => {

            })
            content.innerHTML = alert.Content;
            if (alert.Link) {
                content.setAttribute("href", alert.Link);
                content.addEventListener("click", () => {
                    dismissed[alert.id] = true;
                    localStorage.setItem("dismissedAlerts", JSON.stringify(dismissed));
                })
            }
            if (alert.Dismissable === "1") {
                D2.Div("dismiss", () => {
                    let dismiss = D2.IconOnlyButton("x");
                    dismiss.addEventListener("click", () => {
                        dismissed[alert.id] = true;
                        localStorage.setItem("dismissedAlerts", JSON.stringify(dismissed));
                        element.remove();
                    })
                })
            }
        })
        document.getElementById("alerts").appendChild(element);
    }
}

InitializeAlerts();

new Navbar();
