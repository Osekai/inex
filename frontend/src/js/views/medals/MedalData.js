import {DoRequest} from "../../utils/requests";
import {Medal} from "./Medal";
import {GetSetting, SetSettings} from "../../utils/usersettings";
import {MedalsUI} from "./MedalsUI";
import {parseBoolean} from "../../utils/boolean";

interface MedalCollection {
    [key: number]: Medal
}

export class MedalData {
    /**
     *
     * @type {null}
     */
    static Medals: MedalCollection = null;
    static CurrentMedal: number;

    static async GetMedals() {
        if (this.Medals == null) {
            var MedalsTmp = [];
            
            if (typeof (medals_preload) !== "undefined") {
                
                MedalsTmp = medals_preload['content'];
            } else {
                MedalsTmp = (await DoRequest("GET", "/api/medals/get_all"))['content'];
            }
            this.Medals = {};
            for (var medal of MedalsTmp) {
                this.Medals[medal.Medal_ID] = new Medal(medal);
                this.Medals[medal.Medal_ID].Obtained = false;
                
                if (loggedIn && userData.user_achievements.some(usermedal => usermedal.achievement_id == medal.Medal_ID)) {
                    this.Medals[medal.Medal_ID].Obtained = true;
                }
            }
        }
        return this.Medals;
    }

    static async GetMedalFromID(id: number) {
        if (this.Medals == null) await this.GetMedals();
        return this.Medals[id];
    }

    static GetMedalsSync() {
        if (this.Medals == null) return []
        return this.Medals;
    }

    static LoadExtra(medal: Medal, callbacks: any) {
        DoRequest("POST", `/api/medals/${medal.Medal_ID}/` + (medal.Packs == null ? "beatmaps" : "packs"), medal).then((data) => {
            var content = data['content'];
            if (content.length != 0) {
                this.Medals[content[0].Medal_ID].BeatmapsType = data['message'];
                if (typeof (content[0]) != "undefined") {
                    this.Medals[content[0].Medal_ID].Beatmaps = content;
                }
                if (this.CurrentMedal == medal.Medal_ID) callbacks['beatmaps'](this.Medals[this.CurrentMedal]);
            } else {
                callbacks['beatmaps'](this.Medals[this.CurrentMedal]); // :/
            }
        });
        //DoRequest("POST", `/api/medals/${medal.Medal_ID}/what`, medal).then((data) => {
        //    var content = data['content'];
        //    this.Medals[content[0].Medal_ID].Whatever = content;
        //    if(this.CurrentMedal == medal.Medal_ID) callbacks['beatmaps'](this.Medals[this.CurrentMedal]);
        //});
    }

    static GetObtainedFilter() {
        if (!loggedIn) return "all";
        return GetSetting("medals.obtainedFilter", "all", true);
    }

    static SetObtainedFilter(filter: string) {
        if (!loggedIn) return;
        SetSettings("medals.obtainedFilter", filter, true);
        MedalsUI.CheckObtainedFilter()
    }

    static MigrateObtainedFilter() {
        // TODO: remove this after a few months
        if (!loggedIn) return;
        if (localStorage.getItem("medals.obtainedFilter") != null) return;

        let filter = "all";
        if (parseBoolean(GetSetting("medals.hide_obtained", false, true))) {
            if (parseBoolean(GetSetting("medals.hideUnachievedMedals", false, true))) {
                filter = "hide";
            } else {
                filter = "mark";
            }
        }

        SetSettings("medals.obtainedFilter", filter, true);
        localStorage.removeItem("medals.hide_obtained");
        localStorage.removeItem("medals.hideUnachievedMedals");
    }
}

MedalData.MigrateObtainedFilter();