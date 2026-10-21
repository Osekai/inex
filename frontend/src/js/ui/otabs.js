// otabGhost, otabClearGhost, otabFadeIn and the otab-animate handling in switchTab
// are ported from anthera (frontend/src/js/ui/otabs.js)
import { insertParam, getParam, removeParam } from "../utils/urlQuery.js";

const initializedContainers = new WeakSet();
let popStateBound = false;

// what an absolutely positioned child would actually resolve against. not the same as
// offsetParent: a static ancestor with a transform/filter/contain still becomes the
// containing block, and offsetParent skips right over it
function otabContainingBlock(el) {
    let node = el.parentElement;
    while (node) {
        const cs = getComputedStyle(node);
        if (cs.position !== "static") return node;
        if (cs.transform !== "none" || cs.perspective !== "none" ||
            cs.filter !== "none" || cs.backdropFilter !== "none" ||
            /transform|filter|perspective/.test(cs.willChange) ||
            /paint|layout|strict|content/.test(cs.contain)) return node;
        node = node.parentElement;
    }
    return null; // falls through to the initial containing block
}

// pins a tab where it currently sits so it can fade out while the next one takes its place in flow
function otabGhost(tab, duration) {
    otabClearGhost(tab);
    if (tab.offsetParent === null && tab.offsetHeight === 0) return false;
    
    const rect = tab.getBoundingClientRect();
    const cb = otabContainingBlock(tab);
    let top, left;
    
    if (cb) {
        // top/left resolve against the padding box, which scrolls with the content
        const cbRect = cb.getBoundingClientRect();
        const cbStyle = getComputedStyle(cb);
        top = rect.top - cbRect.top - (parseFloat(cbStyle.borderTopWidth) || 0) + cb.scrollTop;
        left = rect.left - cbRect.left - (parseFloat(cbStyle.borderLeftWidth) || 0) + cb.scrollLeft;
    } else {
        // no containing block anywhere, so it's document coords
        top = rect.top + window.scrollY;
        left = rect.left + window.scrollX;
    }
    
    tab.style.setProperty("--top", top + "px");
    tab.style.setProperty("--left", left + "px");
    tab.style.setProperty("--width", tab.offsetWidth + "px");
    tab.style.setProperty("--height", tab.offsetHeight + "px");
    // top/left place the margin edge, and --width/--height are border box, so neutralise both
    tab.style.margin = "0";
    tab.style.boxSizing = "border-box";
    tab.classList.add("otab-animate-away");
    
    tab._otabTimer = setTimeout(() => {
        tab.classList.add("otab-hidden");
        otabClearGhost(tab);
    }, duration);
    return true;
}

function otabClearGhost(tab) {
    clearTimeout(tab._otabTimer);
    tab.classList.remove("otab-animate-away");
    tab.style.removeProperty("--top");
    tab.style.removeProperty("--left");
    tab.style.removeProperty("--width");
    tab.style.removeProperty("--height");
    tab.style.removeProperty("margin");
    tab.style.removeProperty("box-sizing");
}

// class is stripped afterwards so the next switch can restart it
function otabFadeIn(tab, duration) {
    clearTimeout(tab._otabInTimer);
    tab.classList.remove("otab-animate-in");
    void tab.offsetWidth;
    tab.classList.add("otab-animate-in");
    tab._otabInTimer = setTimeout(() => tab.classList.remove("otab-animate-in"), duration);
}

export function LoadOTabs() {
    let pageOpenEvent = new Event("page-open");
    let oTabContainers = document.querySelectorAll("[otab-container]");

    for (let oTabContainer of oTabContainers) {
        if (initializedContainers.has(oTabContainer)) continue;
        initializedContainers.add(oTabContainer);

        oTabContainer.setAttribute("loaded", "ok");

        let pushHistory = false;
        let oTabs = oTabContainer.querySelectorAll("[otab-name]");
        let oTabButtons = oTabContainer.querySelectorAll("[otab-button]");
        let last_tab = "";

        let delay = 0;
        if (oTabContainer.hasAttribute("otab-delay")) {
            delay = parseInt(oTabContainer.getAttribute("otab-delay")) || 0;
        }

        // otab-animate opts this container into cross-fading, its value overrides the default ms
        const animate = oTabContainer.hasAttribute("otab-animate") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const animDuration = parseInt(oTabContainer.getAttribute("otab-animate")) || 200;

        if(oTabContainer.hasAttribute("otab-height-max")) {
            // we haven't handled load init yet so we can just do some quick stuff here
            var height = 0;
            var tallest = null;
            for (let tab of oTabs) {
                if(tab.getBoundingClientRect().height > height) {
                    height = tab.getBoundingClientRect().height;
                    tallest = tab;
                }
            }

            for (let tab of oTabs) {
                tab.classList.add("otab-hidden");
                if(tab == tallest) {
                    tab.classList.remove("otab-hidden");
                }
            }
            var niceheight = oTabContainer.getBoundingClientRect().height;
            oTabContainer.style.height = niceheight + "px";

            // no need to revert, it'll load the otab-default in a second
        }

        function switchTab(tabName, push = true) {
            // own pass first, unhiding the incoming tab could move the outgoing one before we measure it
            let ghosted = null;
            if (animate && last_tab && last_tab !== tabName) {
                const outgoing = Array.from(oTabs).find(t => t.getAttribute("otab-name") === last_tab);
                if (outgoing && !outgoing.classList.contains("otab-hidden")) {
                    if (otabGhost(outgoing, animDuration)) ghosted = outgoing;
                }
            }

            for (let tab of oTabs) {
                let isTarget = tab.getAttribute("otab-name") === tabName;
                tab.classList.toggle("otab-predelay-activated", isTarget);
                tab.setAttribute("aria-hidden", String(!isTarget));
                if (isTarget) {
                    // might still be fading out if they flicked straight back to it
                    otabClearGhost(tab);
                    if(delay !== 0) {
                        setTimeout(() => {
                            tab.classList.remove("otab-hidden");
                            if (animate) otabFadeIn(tab, animDuration);
                        }, delay);
                    } else {
                        // avoids slight visual flash when changing tabs :)
                        tab.classList.remove("otab-hidden");
                        if (animate) otabFadeIn(tab, animDuration);
                    }
                    if (tab.getAttribute("otab-callback")) {
                        let cb = window[tab.getAttribute("otab-callback")];
                        if (typeof cb === "function") cb();
                    }
                    pageOpenEvent.tab = tabName;
                    tab.dispatchEvent(pageOpenEvent);
                } else if (tab !== ghosted) {
                    otabClearGhost(tab);
                    tab.classList.add("otab-hidden");
                }
            }

            for (let button of oTabButtons) {
                button.classList.toggle(
                    "otab-button-active",
                    button.getAttribute("otab-button") === tabName
                );
            }

            if (!oTabContainer.hasAttribute("otab-no-history")) {
                if (oTabContainer.getAttribute("otab-default") === tabName) {
                    removeParam(oTabContainer.getAttribute("otab-container"));
                } else if (last_tab !== tabName && push) {
                    insertParam(oTabContainer.getAttribute("otab-container"), tabName, pushHistory);
                }
            }

            last_tab = tabName;
            pushHistory = true;

            pageOpenEvent.tab = tabName;
            oTabContainer.dispatchEvent(pageOpenEvent);
        }

        oTabContainer.switch = switchTab;

        for (let oTabButton of oTabButtons) {
            if (oTabButton.closest("[otab-container]") !== oTabContainer) continue;
            if (oTabContainer.getAttribute("otab-no-replace") == null) {
                oTabButton.innerHTML = oTabButton.getAttribute("otab-button");
            }
            if (!oTabButton.dataset.otabBound) {
                oTabButton.addEventListener("click", function (e) {
                    if (e.target.closest("[otab-button]") !== oTabButton) {
                        return;
                    }
                    switchTab(oTabButton.getAttribute("otab-button"));
                });
                oTabButton.dataset.otabBound = "true";
            }
        }

        function loadFromUrl() {
            const param = getParam(oTabContainer.getAttribute("otab-container"));
            if (param != null) {
                switchTab(param, false);
            } else if (oTabContainer.getAttribute("otab-default")) {
                switchTab(oTabContainer.getAttribute("otab-default"));
            }
        }

        // delay load to ensure param availability in some cases
        setTimeout(loadFromUrl, 0);
    }

    if (!popStateBound) {
        window.addEventListener("popstate", () => {
            for (let oTabContainer of document.querySelectorAll("[otab-container]")) {
                const param = getParam(oTabContainer.getAttribute("otab-container"));
                if (param != null && typeof oTabContainer.switch === "function") {
                    oTabContainer.switch(param, false);
                } else if (oTabContainer.getAttribute("otab-default")) {
                    oTabContainer.switch(oTabContainer.getAttribute("otab-default"));
                }
            }
        });
        popStateBound = true;
    }
}

LoadOTabs();