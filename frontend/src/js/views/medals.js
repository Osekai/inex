import {getSections, setSections} from "../utils/urlQuery";
import {DoRequest} from "../utils/requests";

var medalData;
var currentMedal; // ID!


function GetMedalFromUrl() {
    SetMedal(getSections(`/medals/{medal}`)['medal']);
}

/**
 * Sets medal based on input
 * @param inputMedal : string/number Medal name OR Medal ID (ID preferred)
 * @param setUrl : boolean Should we update the URL? this manages history, too.
 */
function SetMedal(inputMedal, setUrl = false) {
    var name = "";
    for (var medal of medalData) {
        if (medal.Name == inputMedal) {
            inputMedal = medal.ID
            name = medal.Name;
        }
        if (medal.ID == inputMedal) {
            name = medal.Name;
        }
    }
    currentMedal = inputMedal;

    console.log("set medal to " + currentMedal);

    if(setUrl) {
        setSections(`/medals/{medal}`, {"medal": name})
    }
}

async function LoadMedal() {

}

async function Load() {
    medalData = await DoRequest("GET", "/api/medals/get_all"); 
    console.log(medalData);
    GetMedalFromUrl();
}

Load();