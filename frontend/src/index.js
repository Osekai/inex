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


class ProfileLink {
    constructor(element, userId) {
        this.element = element;
        this.userId = userId;
        this.deactivated = false;

        this.els = {};
        this.tippyInstance = null;
        this.hrefObserver = null;
        this.popupContent = null;

        this._setup();
    }


    _update() {
        if (this.deactivated) return;
        let value = GetSetting("global.profileLinks", "osekai", true);
        let newHref;
        if (value === "osekai") {
            newHref = "/profiles/" + this.userId;
        } else if (value === "osu") {
            newHref = "https://osu.ppy.sh/users/" + this.userId;
        } else {
            return;
        }
        this.lastWrittenHref = newHref;
        this.element.setAttribute("href", newHref);
    }
    _setup() {
        this._update();
        OnChangeSetting("global.profileLinks", () => {
            if (this.deactivated) return;
            this._update();
        });

        this.element.target = "_blank";

        if (!this.element.hasAttribute("no-url-popup")) {
            this._buildPopupSkeleton();
            this._setupTippy();
        }

        this.hrefObserver = new MutationObserver(() => this._onHrefMutated());
        this.hrefObserver.observe(this.element, { attributes: true, attributeFilter: ["href"] });
    }

    _buildPopupSkeleton() {
        let els = {};
        let popupContent = D2.CustomPlus("a", "profile-popup", {}, () => {
            els["header"] = D2.Div("profile-header", () => {
                els["avatar"] = D2.Image("pfp");
                els["name"] = D2.Text("h2");
                els["flag"] = D2.Image("flag");
            });
            els["medals"] = D2.Div("profile-medals", () => {
                D2.Div("", () => {
                    els["medals-percentage"] = D2.Text("p");
                    els["medals-clubname"] = D2.Text("h3");
                });
                els["medals-club"] = D2.Image("");
            });
        });

        this.els = els;
        this.popupContent = popupContent;

        // point tippy at the new content node if it already exists
        if (this.tippyInstance) {
            this.tippyInstance.setContent(popupContent);
        }
    }

    _setupTippy() {
        this.tippyInstance = tippy(this.element, {
            content: this.popupContent,
            allowHTML: false,
            interactive: true,
            interactiveBorder: 10,
            appendTo: () => document.body,
            placement: "top",
            delay: [100, 0],
            onShow: (instance) => {
                if (this.deactivated) return false;
                this._loadPopupData();
            },
        });
    }

    async _loadPopupData() {
        let userId = this.userId;
        let data = await DoRequest("POST", "/api/profiles/quick/" + userId);
        if (this.deactivated) return;
        if (userId !== this.userId) return;

        let profile = data.content;
        let els = this.els;

        this.popupContent.classList.add("loaded");
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

        this.popupContent.href = "/profiles/" + userId;
    }

    _onHrefMutated() {
        if (this.deactivated) return;
        let current = this.element.getAttribute("href");
        if (current == null) return;
        if (current === this.lastWrittenHref) return;

        let newUserId = current.split("/").pop();
        if (!newUserId || newUserId === this.userId) return;

        this.userId = newUserId;

        // rebuild the popup from scratch so it's back to a clean skeleton
        if (this.popupContent) {
            this._buildPopupSkeleton();
        }

        this._update();
    }

    deactivate() {
        if (this.deactivated) return;
        this.deactivated = true;

        if (this.hrefObserver) this.hrefObserver.disconnect();
        if (this.tippyInstance) this.tippyInstance.destroy();
    }
}

let profileUrlList = []; // array of ProfileLink instances

function profileUrls() {
    for (let element of document.querySelectorAll("a")) {
        if (profileUrlList.some(p => p.element === element)) continue;
        if (element.hasAttribute("no-url-replace")) continue;
        let href = element.getAttribute("href");
        if (href == null) continue;
        if (href.startsWith("/profiles/")) {
            let split = href.split("/");
            if (split.length < 2) continue;
            let userId = split[2];
            profileUrlList.push(new ProfileLink(element, userId));
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
