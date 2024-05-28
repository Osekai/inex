import {DoRequest} from "../../utils/requests";
import {Medal} from "./Medal";

export class MedalData {
    /**
     *
     * @type {null}
     */
    static Medals: Medal[] = null;

    static async GetMedals() {
        if (this.Medals == null) {
            this.Medals = (await DoRequest("GET", "/api/medals/get_all"))['content'];
        }
        return this.Medals;
    }

    static GetMedalsSync() {
        if (this.Medals == null) return []
        return this.Medals;
    }

}