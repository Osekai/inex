import {DoRequest} from "./requests";
import {IsJsonString} from "./json";

if(typeof(window.localSetAlerts) == "undefined") window.localSetAlerts = {};

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
        console.log(localSetAlerts);
        if(typeof window.localSetAlerts[key] !== "undefined") {
            for(var item of window.localSetAlerts[key]) {
                console.log("callback");
                item(value);
            }
        }
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
        console.log(localStorage.getItem(key));
        if(localStorage.getItem(key) == null) return defaultValue;
        return JSON.parse(localStorage.getItem(key));
    }
    for (var setting in userSettings) {
        if (setting == key) {
            return userSettings[setting];
        }
    }
    return defaultValue;
}

function OnChangeSetting(name, callback) {
    // only local
    if(typeof(window.localSetAlerts[name]) == "undefined") window.localSetAlerts[name] = [];
    window.localSetAlerts[name].push(callback);
}


export { GetSetting, SetSettings, OnChangeSetting };