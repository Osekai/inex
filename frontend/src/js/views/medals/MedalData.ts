import {DoRequest} from "../../utils/requests";
import {Medal} from "./Medal";

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
            var MedalsTmp = (await DoRequest("GET", "/api/medals/get_all"))['content'];
            this.Medals = {};
            for(var medal of MedalsTmp) {
                this.Medals[medal.Medal_ID] = medal;
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
        DoRequest("POST", `/api/medals/${medal.Medal_ID}/beatmaps`, medal).then((data) => {
            var content = data['content'];
            if(typeof(content[0]) != "undefined")
            this.Medals[content[0].Medal_ID].Beatmaps = content;
            if(this.CurrentMedal == medal.Medal_ID) callbacks['beatmaps'](this.Medals[this.CurrentMedal]);
        });
        //DoRequest("POST", `/api/medals/${medal.Medal_ID}/what`, medal).then((data) => {
        //    var content = data['content'];
        //    this.Medals[content[0].Medal_ID].Whatever = content;
        //    if(this.CurrentMedal == medal.Medal_ID) callbacks['beatmaps'](this.Medals[this.CurrentMedal]);
        //});
    }
}