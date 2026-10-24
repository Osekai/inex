import "../../css/views/snapshots_admin.css";

import {D2} from "../utils/d2";
import {DoRequest, DoRequestWithLoader} from "../utils/requests";
import {PushToast} from "../ui/toasts";
import {CenteredLoader} from "../utils/loaderUtils";
import {SnapshotsEditor} from "./snapshots/SnapshotsEditor";

const STATUS_NAMES = ["Pending", "Accepted", "Denied"];

function EditorUrl(id, legacyFile = null) {
    let url = "/snapshots/" + id + "?versiontab=edit";
    if (legacyFile != null) {
        url += "&legacy_file=" + encodeURIComponent(legacyFile);
    }
    return url;
}

async function LoadCreate() {
    let outer = document.getElementById("create");
    if (outer == null) return;

    let groups = (await DoRequest("GET", "/api/snapshots/groups"))['content'];

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
                group = SnapshotsEditor.Dropdown(options, options[0]?.value);
            });
        });
        let create = D2.Text("button", "Create", "lumen-button");
        create.addEventListener("click", async () => {
            let resp = await DoRequestWithLoader("POST", "/api/snapshots/create", {
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
        resp = await DoRequestWithLoader("POST", "/api/snapshots/admin/migrate/" + legacy.ID, {}, "Migrating " + legacy.Version + ", this can take a while");
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
    button.closest(".snapshots-admin-row").remove();

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

    let resp = await DoRequest("GET", "/api/snapshots/admin/legacy");
    outer.innerHTML = "";
    if (!resp.success) {
        outer.appendChild(D2.Text("p", resp.message, "snapshots-admin-info"));
        return;
    }
    if (resp.content.length == 0) {
        outer.appendChild(D2.Text("p", "Everything's been migrated!", "snapshots-admin-info"));
        return;
    }

    for (let legacy of resp.content) {
        outer.appendChild(D2.Div("snapshots-admin-row", () => {
            D2.Div("info", () => {
                D2.Text("h1", legacy.Version);
                D2.Text("p", (legacy.Name ?? "") + " · released " + legacy.Release_Date + " · archived by " + legacy.Archiver + " · " + legacy.Screenshots + " screenshots");
            });
            if (legacy.File == null) {
                D2.Text("span", "no file", "snapshots-admin-pill warn");
            } else if (!legacy.File_Is_Zip) {
                let pill = D2.Text("span", "not a .zip", "snapshots-admin-pill warn");
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
        outer.appendChild(D2.Text("p", "No submissions yet.", "snapshots-admin-info"));
        return;
    }

    for (let submission of submissions) {
        outer.appendChild(D2.Div("snapshots-admin-row", () => {
            D2.Div("info", () => {
                D2.Text("h1", submission.Title);
                let by = submission.Username ?? ("#" + submission.User_ID);
                D2.Text("p", "by " + by + " · " + D2.TimeFull(submission.Date, {style: "short"}) + " · " + STATUS_NAMES[submission.Status]);
                if (submission.Description != null) D2.Text("p", submission.Description, "description");
                let link = D2.Link(submission.Link, "", submission.Link);
                link.target = "_blank";
            });

            let setStatus = async (status) => {
                let resp = await DoRequest("POST", "/api/snapshots/admin/submissions/" + submission.ID + "/status", {"status": status});
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

    let resp = await DoRequest("GET", "/api/snapshots/admin/submissions");
    if (!resp.success) {
        outer.innerHTML = "";
        outer.appendChild(D2.Text("p", resp.message, "snapshots-admin-info"));
        return;
    }
    RenderSubmissions(outer, resp.content);
}

LoadCreate();
LoadLegacy();
LoadSubmissions();
