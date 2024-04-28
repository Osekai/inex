import {DoRequest} from "./requests";
import {IsJsonString} from "./json";

async function SetSettings(key, value, local = false) {
    if(!loggedIn && local == false) {
        return;
    }
    if(typeof(userSettings) == "undefined" || userSettings == null) {
        userSettings = {};
    }

    if(local) {
        var valueParsed = value;
        if(IsJsonString(valueParsed)) valueParsed = JSON.parse(valueParsed);
        localStorage.setItem(key, value);
    } else {
        userSettings[key] = value;
        await DoRequest("POST", "/api/usersettings/set", {
            "key": key,
            "value": value
        })
    }
}

function GetSetting(key, defaultValue, local) {
    if(!loggedIn && local == false) return defaultValue;
    if(local) {
        if(localStorage.getItem(key) == null) return defaultValue;
        return localStorage.getItem(key);
    }
    for (var setting in userSettings) {
        if (setting == key) {
            return userSettings[setting];
        }
    }
    return defaultValue;
}

export { GetSetting, SetSettings };