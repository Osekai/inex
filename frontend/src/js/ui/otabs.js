import { insertParam, getParam, removeParam } from "../utils/urlQuery.js";

document.addEventListener("DOMContentLoaded", function () {

    let pageOpenEvent = new Event("page-open");
    let oTabContainers = document.querySelectorAll("[otab-container]");
    for (let oTabContainer of oTabContainers) {
        let pushHistory = false;
        let oTabs = oTabContainer.querySelectorAll("[otab-name]")
        let oTabButtons = oTabContainer.querySelectorAll("[otab-button]")
        let last_tab = "";
        function switchTab(tabName, push = true) {
            for (let tab of oTabs) {
                if (tab.getAttribute("otab-name") === tabName) {
                    tab.classList.remove("otab-hidden");
                    tab.setAttribute("aria-hidden", "false");
                    if (tab.getAttribute("otab-callback")) {
                        console.log(tab.getAttribute("otab-callback"));
                        window[tab.getAttribute("otab-callback")]();
                    }
                    tab.dispatchEvent(pageOpenEvent);
                } else {
                    tab.setAttribute("aria-hidden", "true");
                    tab.classList.add("otab-hidden");
                }
            }

            for (let button of oTabButtons) {
                if (button.getAttribute("otab-button") === tabName) {
                    button.classList.add("otab-button-active");
                } else {
                    button.classList.remove("otab-button-active");
                }
            }
            if (oTabContainer.getAttribute("otab-default") != null && tabName === oTabContainer.getAttribute("otab-default")) removeParam(oTabContainer.getAttribute("otab-container"))
            else if (last_tab != tabName && push == true) insertParam(oTabContainer.getAttribute("otab-container"), tabName, pushHistory)
            last_tab = tabName;
            pushHistory = true;

            oTabContainer.dispatchEvent(pageOpenEvent);
        }




        for (let oTabButton of oTabButtons) {
            if(oTabButton.closest("[otab-container]") != oTabContainer) continue;
            if(oTabContainer.getAttribute("otab-no-replace") == null)
                oTabButton.innerHTML = oTabButton.getAttribute("otab-button");
            oTabButton.addEventListener("click", function () {
                switchTab(oTabButton.getAttribute("otab-button"));
            });
        }

        function loadFromUrl() {
            if (getParam(oTabContainer.getAttribute("otab-container")) != null) {
                switchTab(getParam(oTabContainer.getAttribute("otab-container")), false)
            } else {
                if(oTabContainer.getAttribute("otab-default") != null)
                    switchTab(oTabContainer.getAttribute("otab-default"));
            }
        }
        window.addEventListener("popstate", function () {
            loadFromUrl();
        })
        loadFromUrl();
    }
});