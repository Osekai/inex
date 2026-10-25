import "../../css/views/archive.css";
// <solution-note> and friends, same as medal solutions
import "./medals/SolutionElements.js";

import {getSections, setSections} from "../utils/urlQuery";
import {ArchiveData} from "./archive/ArchiveData";
import {ArchiveUI} from "./archive/ArchiveUI";
import {ArchiveSidebar} from "./archive/ui/ArchiveSidebar";
import {ArchiveEditor} from "./archive/ArchiveEditor";
import {ArchiveSubmit} from "./archive/ArchiveSubmit";
import {ArchiveHome} from "./archive/ArchiveHome";

function GetVersionFromUrl() {
    let sections = getSections(`/archive/{version}`);
    let id = null;
    if (sections != null) {
        id = sections['version'];
    }
    SetVersion(id, false, true);
}

document.getElementById("back").addEventListener("click", () => {
    SetVersion("", true);
});

// sidebar toolbar and homepage both have one, logged out they're links to /login instead
for (let button of document.querySelectorAll("button[submit-version]")) {
    button.addEventListener("click", () => {
        ArchiveSubmit.Open();
    });
}

document.getElementById("archive_home").addEventListener("click", () => {
    SetVersion("", true);
});

window.addEventListener("popstate", () => {
    GetVersionFromUrl();
});

/**
 * Sets the version on the page
 * @param id : number Version ID, empty for the homepage
 * @param setUrl : boolean Should we update the URL? this manages history, too.
 * @param scrollTo : boolean Scroll the sidebar to the version
 */
export function SetVersion(id, setUrl = false, scrollTo = false) {
    if (id == null || id === "" || id === "undefined") {
        ArchiveData.CurrentVersion = null;
        ArchiveUI.ShowHome();
        if (sidebar != null) sidebar.SetActive(null);
        if (setUrl) setSections(`/archive/{version}`, {"version": ""});
        return;
    }

    let version = ArchiveData.GetVersionFromID(id);
    if (version == null) {
        SetVersion("", setUrl);
        return;
    }

    if (setUrl) {
        setSections(`/archive/{version}`, {"version": version.ID});
    }

    ArchiveData.CurrentVersion = version.ID;
    if (sidebar != null) {
        sidebar.SetActive(version.ID);
        if (scrollTo) sidebar.ScrollTo(version.ID);
    }
    ArchiveUI.LoadVersion(version);
}

var sidebar = null;

ArchiveUI.OnVersionLink = (id) => {
    SetVersion(id, true, true);
};

ArchiveUI.OnFullLoaded = (full) => {
    ArchiveEditor.Load(full);
};

// admin changed something, redraw with the fresh data
ArchiveEditor.OnChanged = (full) => {
    sidebar.RenderAll();
    let version = ArchiveData.GetVersionFromID(full.ID);
    if (version != null) {
        ArchiveUI.Refresh(version, full);
    }
};

ArchiveEditor.OnDeleted = () => {
    sidebar.RenderAll();
    SetVersion("", true);
};

async function Load() {
    await ArchiveData.GetVersions();
    await ArchiveData.GetGroups();

    sidebar = new ArchiveSidebar();
    sidebar.LoadSidebar();
    ArchiveHome.Load();

    GetVersionFromUrl();
}

Load();
