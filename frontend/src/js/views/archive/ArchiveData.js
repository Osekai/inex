import {DoRequest} from "../../utils/requests";

export class ArchiveData {
    static Versions = null;
    static Groups = null;
    static Full = {};
    static CurrentVersion = null;

    static async GetVersions() {
        if (this.Versions == null) {
            if (typeof (archive_preload) !== "undefined") {
                this.Versions = archive_preload['content'];
            } else {
                this.Versions = (await DoRequest("GET", "/api/archive/all"))['content'];
            }
        }
        return this.Versions;
    }

    static async GetGroups() {
        if (this.Groups == null) {
            if (typeof (archive_groups_preload) !== "undefined") {
                this.Groups = archive_groups_preload['content'];
            } else {
                this.Groups = (await DoRequest("GET", "/api/archive/groups"))['content'];
            }
        }
        return this.Groups;
    }

    // after an admin changes something, the preload is stale
    static async Refresh(full = null) {
        this.Versions = (await DoRequest("GET", "/api/archive/all"))['content'];
        if (full != null) {
            this.Full[full.ID] = full;
        }
    }

    static FormatSize(bytes) {
        if (bytes == null) return "";
        let units = ["B", "KB", "MB", "GB"];
        let size = bytes;
        let unit = 0;
        while (size >= 1024 && unit < units.length - 1) {
            size = size / 1024;
            unit++;
        }
        let decimals = 1;
        if (unit == 0) {
            decimals = 0;
        }
        return size.toFixed(decimals) + " " + units[unit];
    }

    static GetVersionsSync() {
        if (this.Versions == null) return [];
        return this.Versions;
    }

    static GetGroupsSync() {
        if (this.Groups == null) return [];
        return this.Groups;
    }

    static GetVersionFromID(id) {
        for (let version of this.GetVersionsSync()) {
            if (version.ID == id) {
                return version;
            }
        }
        return null;
    }

    // screenshots, mirrors etc only come with the full version
    static async GetFull(id) {
        if (this.Full[id] != null) return this.Full[id];

        let resp = await DoRequest("GET", `/api/archive/${id}`);
        if (!resp.success) return null;

        this.Full[id] = resp.content;
        return this.Full[id];
    }

    static Record(id, type) {
        DoRequest("POST", `/api/archive/${id}/record/${type}`);
    }

    // release dates are plain dates, so keep them local or they shift a day in some timezones
    static ReleaseDate(version) {
        return new Date(version.Release_Date + "T00:00:00");
    }
}
