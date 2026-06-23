import { insertParam, getParam, removeParam } from "../utils/urlQuery.js";

const initializedContainers = new WeakSet();
let popStateBound = false;

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
            for (let tab of oTabs) {
                let isTarget = tab.getAttribute("otab-name") === tabName;
                tab.classList.toggle("otab-predelay-activated", isTarget);
                tab.setAttribute("aria-hidden", String(!isTarget));
                if (isTarget) {
                    if(delay !== 0) {
                        setTimeout(() => {
                            tab.classList.remove("otab-hidden")
                        }, delay);
                    } else {
                        // avoids slight visual flash when changing tabs :)
                        tab.classList.remove("otab-hidden")
                    }
                    if (tab.getAttribute("otab-callback")) {
                        let cb = window[tab.getAttribute("otab-callback")];
                        if (typeof cb === "function") cb();
                    }
                    pageOpenEvent.tab = tabName;
                    tab.dispatchEvent(pageOpenEvent);
                } else {
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