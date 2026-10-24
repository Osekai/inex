import {ArchiveData} from "../ArchiveData";
import {SetVersion} from "../../archive";
import {D2} from "../../../utils/d2";

export class ArchiveSidebar {
    RenderVersionButton(version) {
        let button = D2.Div("archive-version-button", () => {
            if (version.Thumbnail != null) {
                D2.Image("thumb", version.Thumbnail, null, version.Version);
            } else {
                D2.Div("thumb placeholder");
            }
            D2.Div("info", () => {
                D2.Text("h1", version.Version);
                if (version.Published != 1) {
                    D2.Text("span", "unpublished", "archive-unpublished-pill");
                }
                D2.Text("h2", D2.TimeFull(ArchiveData.ReleaseDate(version), {style: "short"}));
            });
            // name only exists if they're in Rankings_Users, fall back to the id like the header does
            if (version.Meta_Archiver_ID != null) {
                D2.Div("archiver", () => {
                    D2.Text("p", "archived by");
                    D2.Text("strong", version.Archiver_Name ?? ("#" + version.Meta_Archiver_ID));
                });
            }
        });
        button.setAttribute("version-button-id", version.ID);
        button.addEventListener("click", () => {
            SetVersion(version.ID, true, false);
        });
        return button;
    }

    // renders a list of versions into a sidebar panel, split up by year
    RenderPanel(panelId, tabName, versions) {
        let panel = document.getElementById(panelId);
        if (panel == null) return;
        panel.innerHTML = "";
        // the panel's border layers are absolute, so scroll an inner div instead of the panel
        let inner = D2.Div("scroll");
        panel.appendChild(inner);

        let years = {};
        for (let version of versions) {
            let year = ArchiveData.ReleaseDate(version).getFullYear();
            if (typeof (years[year]) == "undefined") {
                years[year] = [];
            }
            years[year].push(version);
        }

        // object keys come out ascending, newest first please
        let yearList = Object.keys(years).sort((a, b) => b - a);
        this.years[tabName] = {"panel": panelId, "years": yearList};

        if (yearList.length == 0) {
            inner.appendChild(D2.Text("p", "No versions here yet!", "archive-empty"));
            return;
        }

        for (let year of yearList) {
            let section = D2.Div("archive-year", () => {
                D2.Text("h1", year);
                for (let version of years[year]) {
                    this.RenderVersionButton(version);
                }
            });
            section.id = panelId + "-year-" + year;
            inner.appendChild(section);
        }
    }

    years = {};

    RenderAll() {
        // keep everyone's scroll where it was
        let scrolls = {};
        for (let scroll of document.querySelectorAll(".archive-sidebar .scroll")) {
            // search results panel has no id, it gets rebuilt anyway
            if (scroll.parentElement.id == "") continue;
            scrolls[scroll.parentElement.id] = scroll.scrollTop;
        }

        let versions = ArchiveData.GetVersionsSync();

        for (let group of ArchiveData.GetGroupsSync()) {
            let inGroup = versions.filter(version => version.Group_ID == group.ID && version.Published == 1);
            this.RenderPanel("sidebar-group-" + group.ID, "group-" + group.ID, inGroup);
        }

        // only there for admins
        let unpublished = versions.filter(version => version.Published != 1);
        this.RenderPanel("sidebar-unpublished", "unpublished", unpublished);

        let container = document.querySelector("[otab-container='sidebar']");
        let current = container.querySelector(".otab-button-active");
        if (current != null) {
            this.RenderYears(current.getAttribute("otab-button"));
        } else {
            this.RenderYears(container.getAttribute("otab-default"));
        }

        this.Search();
        if (ArchiveData.CurrentVersion != null) {
            this.SetActive(ArchiveData.CurrentVersion);
        }

        for (let id in scrolls) {
            let scroll = document.querySelector("#" + id + " > .scroll");
            if (scroll != null) scroll.scrollTop = scrolls[id];
        }
    }

    // the little year tabs down the side, they just scroll the panel
    RenderYears(tabName) {
        let outer = document.getElementById("archive-years");
        outer.innerHTML = "";

        let info = this.years[tabName];
        if (info == null) return;

        let scroll = document.querySelector("#" + info.panel + " > .scroll");

        for (let year of info.years) {
            let button = D2.Text("a", "'" + year.toString().slice(-2));
            button.setAttribute("tooltip", year);
            button.addEventListener("click", () => {
                let section = document.getElementById(info.panel + "-year-" + year);
                scroll.scrollTo({top: section.offsetTop, behavior: "smooth"});
            });
            outer.appendChild(button);
        }
    }

    // searching swaps the whole tab/panel setup for one flat list of everything
    Search(text = null) {
        let input = document.getElementById("version_search");
        if (text == null) {
            text = input.value;
        }
        text = text.trim().toLowerCase();

        let sidebar = document.querySelector(".archive-sidebar");
        let results = document.getElementById("search-results");
        results.innerHTML = "";

        if (text.length == 0) {
            sidebar.classList.remove("searching");
            document.getElementById("version_search_clear").classList.add("hidden");
            return;
        }
        sidebar.classList.add("searching");
        document.getElementById("version_search_clear").classList.remove("hidden");

        let found = 0;
        for (let version of ArchiveData.GetVersionsSync()) {
            let show = false;
            if (version.Version.toLowerCase().includes(text)) show = true;
            if (version.Meta_Name != null && version.Meta_Name.toLowerCase().includes(text)) show = true;
            if (version.Archiver_Name != null && version.Archiver_Name.toLowerCase().includes(text)) show = true;
            if (!show) continue;

            results.appendChild(this.RenderVersionButton(version));
            found++;
        }

        if (found == 0) {
            results.appendChild(D2.Text("p", "Can't find that version!", "archive-empty"));
        }

        if (ArchiveData.CurrentVersion != null) {
            this.SetActive(ArchiveData.CurrentVersion);
        }
    }

    LoadSidebar() {
        let container = document.querySelector("[otab-container='sidebar']");
        container.addEventListener("page-open", (e) => {
            this.RenderYears(e.tab);
        });

        let input = document.getElementById("version_search");
        input.addEventListener("keyup", () => {
            this.Search(input.value);
        });
        document.getElementById("version_search_clear").addEventListener("click", () => {
            input.value = "";
            this.Search("");
        });

        this.RenderAll();
    }

    SetActive(id) {
        for (let button of document.querySelectorAll("[version-button-id]")) {
            button.classList.toggle("active", button.getAttribute("version-button-id") == id);
        }
    }

    ScrollTo(id) {
        let selector = ".archive-versions [version-button-id='" + id + "']";
        if (document.querySelector(".archive-sidebar").classList.contains("searching")) {
            selector = "#search-results [version-button-id='" + id + "']";
        }
        let button = document.querySelector(selector);
        if (button == null) return;
        if (button.classList.contains("hidden")) return;

        setTimeout(() => {
            button.scrollIntoView({"behavior": "smooth", "block": "center"});
        }, 100);
    }
}
