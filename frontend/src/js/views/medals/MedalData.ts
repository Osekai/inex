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
            // @ts-ignore
            if (typeof (medals_preload) !== "undefined") {
                // @ts-ignore
                MedalsTmp = medals_preload['content'];
            } else {
                MedalsTmp = (await DoRequest("GET", "/api/medals/get_all"))['content'];
            }
            this.Medals = {};
            for (var medal of MedalsTmp) {
                this.Medals[medal.Medal_ID] = new Medal(medal);
                this.Medals[medal.Medal_ID].Obtained = false;
                // @ts-ignore
                if (loggedIn && userData.user_achievements.some(usermedal => usermedal.achievement_id == medal.Medal_ID)) {
                    this.Medals[medal.Medal_ID].Obtained = true;
                }
            }
            console.log(this.Medals);
        }
        return this.Medals;
    }

    static GetMedalsSync() {
        if (this.Medals == null) return []
        return this.Medals;
    }

    static LoadExtra(medal: Medal, callbacks: any) {
        DoRequest("POST", `/api/medals/${medal.Medal_ID}/` + (medal.Packs == null ? "beatmaps" : "packs"), medal).then((data) => {
            var content = data['content'];
            console.log(data);
            this.Medals[content[0].Medal_ID].BeatmapsType = data['message'];
            if (typeof (content[0]) != "undefined") {
                this.Medals[content[0].Medal_ID].Beatmaps = content;
            }
            if (this.CurrentMedal == medal.Medal_ID) callbacks['beatmaps'](this.Medals[this.CurrentMedal]);
        });
        //DoRequest("POST", `/api/medals/${medal.Medal_ID}/what`, medal).then((data) => {
        //    var content = data['content'];
        //    this.Medals[content[0].Medal_ID].Whatever = content;
        //    if(this.CurrentMedal == medal.Medal_ID) callbacks['beatmaps'](this.Medals[this.CurrentMedal]);
        //});
    }

    static ObtainedFilterActive() {
        // @ts-ignore
        if (!loggedIn) return;
        return parseBoolean(GetSetting("medals.hide_obtained", false, true));
    }

    static SetObtainedFilterActive(b: boolean) {
        // @ts-ignore
        if (!loggedIn) return;
        SetSettings("medals.hide_obtained", b, true);
        MedalsUI.CheckObtainedFilter()
    }
}