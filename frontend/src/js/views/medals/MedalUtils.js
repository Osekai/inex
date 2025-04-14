import {MedalData} from "./MedalData";
import {Medal} from "./Medal";

export class MedalUtils {
    static GetMedalFromName(name : string|number, looping = false): Medal {
        for (let medal of Object.values(MedalData.GetMedalsSync())) {
            if (medal.Name === name) {
                return medal;
            }
        }
        if(!looping) return this.GetMedalFromID(name, true);
    }

    static GetMedalFromID(id : string|number, looping = false): Medal {
        for (let medal of Object.values(MedalData.GetMedalsSync())) {
            if (medal.Medal_ID === id) {
                return medal;
            }
        }
        if(!looping) return this.GetMedalFromName(id, true);
    }

    static GetCurrentMedal() : Medal {
        return this.GetMedalFromID(MedalData.CurrentMedal);
    }
}