import "../../css/views/archive_admin.css";

import {D2} from "../utils/d2";
import {UTCify} from "../utils/time";
import {DoRequest, DoRequestWithLoader} from "../utils/requests";
import {PushToast} from "../ui/toasts";
import {CenteredLoader} from "../utils/loaderUtils";
import {ArchiveEditor} from "./archive/ArchiveEditor";
import {InputTextarea} from "../utils/dom";

const STATUS_NAMES = ["Pending", "Accepted", "Denied"];

function EditorUrl(id, legacyFile = null) {
    let url = "/archive/" + id + "?versiontab=edit";
    if (legacyFile != null) {
        url += "&legacy_file=" + encodeURIComponent(legacyFile);
    }
    return url;
}

async function LoadCreate() {
    let outer = document.getElementById("create");
    if (outer == null) return;

    let groups = (await DoRequest("GET", "/api/archive/groups"))['content'];

    let version, releaseDate, group;
    D2._appendChildren(outer, () => {
        // same slide fields as the editor
        D2.Div("form", () => {
            D2.Div("input-with-text slide", () => {
                D2.Text("p", "Version");
                version = D2.Input("", "text");
            });
            D2.Div("input-with-text slide", () => {
                D2.Text("p", "Release Date");
                releaseDate = D2.Input("", "date");
            });
            D2.Div("input-with-text slide", () => {
                D2.Text("p", "Group");
                let options = groups.map(g => ({"name": g.Group_Name, "value": g.ID}));
                group = ArchiveEditor.Dropdown(options, options[0]?.value);
            });
        });
        let create = D2.Text("button", "Create", "lumen-button");
        create.addEventListener("click", async () => {
            let resp = await DoRequestWithLoader("POST", "/api/archive/create", {
                "Version": version.value,
                "Release_Date": releaseDate.value,
                "Group_ID": group.value
            }, "Creating");
            if (!resp.success) {
                PushToast({theme: "error", content: resp.message});
                return;
            }
            window.location.href = EditorUrl(resp.content.ID);
        });
    });
}

async function Migrate(legacy, button) {
    button.disabled = true;
    let resp;
    try {
        resp = await DoRequestWithLoader("POST", "/api/archive/admin/migrate/" + legacy.ID, {}, "Migrating " + legacy.Version + ", this can take a while");
    } finally {
        button.disabled = false;
    }

    if (!resp.success) {
        PushToast({theme: "error", content: resp.message});
        return;
    }
    for (let error of resp.content.Errors) {
        PushToast({theme: "error", content: error});
    }

    // it's not eclipse-only anymore
    button.closest(".archive-admin-row").remove();

    let url = EditorUrl(resp.content.ID, resp.content.LegacyFile);
    let tab = window.open(url, "_blank");
    if (tab == null) {
        // the click was too long ago so the browser blocked it, a toast button counts as a fresh click
        PushToast({
            theme: "success",
            content: "Migrated " + legacy.Version,
            buttons: {
                "Open": () => window.open(url, "_blank"),
            },
        });
        return;
    }
    PushToast({theme: "success", content: "Migrated " + legacy.Version});
}

async function LoadLegacy() {
    let outer = document.getElementById("legacy");
    if (outer == null) return;
    outer.appendChild(CenteredLoader());

    let resp = await DoRequest("GET", "/api/archive/admin/legacy");
    outer.innerHTML = "";
    if (!resp.success) {
        outer.appendChild(D2.Text("p", resp.message, "archive-admin-info"));
        return;
    }
    if (resp.content.length == 0) {
        outer.appendChild(D2.Text("p", "Everything's been migrated!", "archive-admin-info"));
        return;
    }

    for (let legacy of resp.content) {
        outer.appendChild(D2.Div("archive-admin-row", () => {
            D2.Div("info", () => {
                D2.Text("h1", legacy.Version);
                D2.Text("p", (legacy.Name ?? "") + " · released " + legacy.Release_Date + " · archived by " + legacy.Archiver + " · " + legacy.Screenshots + " screenshots");
            });
            if (legacy.File == null) {
                D2.Text("span", "no file", "archive-admin-pill warn");
            } else if (!legacy.File_Is_Zip) {
                let pill = D2.Text("span", "not a .zip", "archive-admin-pill warn");
                pill.setAttribute("tooltip", "The file won't be migrated, you'll need to re-archive it");
            }
            let button = D2.Text("button", "Migrate", "lumen-button");
            button.addEventListener("click", () => Migrate(legacy, button));
        }));
    }
}

function RenderSubmissions(outer, submissions) {
    outer.innerHTML = "";
    if (submissions.length == 0) {
        outer.appendChild(D2.Text("p", "No submissions yet.", "archive-admin-info"));
        return;
    }

    for (let submission of submissions) {
        outer.appendChild(D2.Div("archive-admin-row", () => {
            D2.Div("info", () => {
                D2.Text("h1", submission.Title);
                let by = submission.Username ?? ("#" + submission.User_ID);
                D2.Text("p", "by " + by + " · " + D2.TimeFull(UTCify(submission.Date), {style: "short"}) + " · " + STATUS_NAMES[submission.Status]);
                if (submission.Description != null) D2.Text("p", submission.Description, "description");
                let link = D2.Link(submission.Link, "", submission.Link);
                link.target = "_blank";
            });

            let setStatus = async (status) => {
                let resp = await DoRequest("POST", "/api/archive/admin/submissions/" + submission.ID + "/status", {"status": status});
                if (!resp.success) {
                    PushToast({theme: "error", content: resp.message});
                    return;
                }
                RenderSubmissions(outer, resp.content);
            };

            if (submission.Status != 1) {
                let accept = D2.Text("button", "Accept", "lumen-button");
                accept.addEventListener("click", () => setStatus(1));
            }
            if (submission.Status != 2) {
                let deny = D2.Text("button", "Deny", "lumen-button border");
                deny.addEventListener("click", () => setStatus(2));
            }
        }));
    }
}

async function LoadSubmissions() {
    let outer = document.getElementById("submissions");
    if (outer == null) return;
    outer.appendChild(CenteredLoader());

    let resp = await DoRequest("GET", "/api/archive/admin/submissions");
    if (!resp.success) {
        outer.innerHTML = "";
        outer.appendChild(D2.Text("p", resp.message, "archive-admin-info"));
        return;
    }
    RenderSubmissions(outer, resp.content);
}

function RenderFeatured(outer, features) {
    outer.innerHTML = "";
    if (features.length == 0) {
        outer.appendChild(D2.Text("p", "Nothing's been featured yet.", "archive-admin-info"));
        return;
    }

    for (let feature of features) {
        outer.appendChild(D2.Div("archive-admin-row", () => {
            D2.Div("info", () => {
                D2.Text("h1", (feature.Meta_Name ?? "") + " " + (feature.Version ?? "(deleted version)"));
                let status = "ended";
                if (feature.Active == 1) status = "active";
                D2.Text("p", status + " · until " + D2.TimeFull(UTCify(feature.End_Date), {style: "short"}) + " · by " + (feature.Created_By_Name ?? ("#" + feature.Created_By)));
                D2.Text("p", feature.Description, "description");
            });
            if (feature.Active == 1) {
                D2.Text("span", "live", "archive-admin-pill live");
            }
            let del = D2.Text("button", "Delete", "lumen-button border");
            del.addEventListener("click", async () => {
                let resp = await DoRequest("POST", "/api/archive/admin/featured/" + feature.ID + "/delete");
                if (!resp.success) {
                    PushToast({theme: "error", content: resp.message});
                    return;
                }
                RenderFeatured(outer, resp.content);
            });
        }));
    }
}

async function LoadFeatured() {
    let create = document.getElementById("featured_create");
    let list = document.getElementById("featured_list");
    if (create == null) return;

    let all = (await DoRequest("GET", "/api/archive/all"))['content'];
    // only published ones can show up on the homepage anyway
    let options = [];
    for (let version of all) {
        if (version.Published != 1) continue;
        let name = version.Version;
        if (version.Meta_Name != null) {
            name += " (" + version.Meta_Name + ")";
        }
        options.push({"name": name, "value": version.ID});
    }

    let version, endDate, description;
    D2._appendChildren(create, () => {
        D2.Div("form", () => {
            D2.Div("input-with-text slide", () => {
                D2.Text("p", "Version");
                version = ArchiveEditor.Dropdown([{"name": "Pick a version", "value": ""}, ...options], "", true);
            });
            D2.Div("input-with-text slide", () => {
                D2.Text("p", "Feature until");
                endDate = D2.Input("", "date");
            });
            // same code field as the version description, so <solution-note> etc work
            description = InputTextarea("Why is this version cool?", "code", "");
            D2._currentParent.appendChild(description.element);
        });
        let button = D2.Text("button", "Create a Feature", "lumen-button");
        button.addEventListener("click", async () => {
            let resp = await DoRequestWithLoader("POST", "/api/archive/admin/featured/create", {
                "version": version.value,
                "end_date": endDate.value,
                "description": description.value(),
            }, "Featuring");
            if (!resp.success) {
                PushToast({theme: "error", content: resp.message});
                return;
            }
            PushToast({theme: "success", content: "Featured!"});
            RenderFeatured(list, resp.content);
        });
    });

    let resp = await DoRequest("GET", "/api/archive/admin/featured");
    if (!resp.success) {
        list.appendChild(D2.Text("p", resp.message, "archive-admin-info"));
        return;
    }
    RenderFeatured(list, resp.content);
}

LoadCreate();
LoadFeatured();
LoadLegacy();
LoadSubmissions();
