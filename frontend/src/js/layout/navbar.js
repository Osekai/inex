import {D2} from "../utils/d2";
import {GetSetting, SetSettings} from "../utils/usersettings";

export class Settings {
    settings = {
        "medals.hideUnachievedMedals": {
            "type": "boolean",
            "default": false,
            "title": "Hide filtered medals",
            "description": "Hide medals that you've already achieved. Only enabled when medals filter is on.",
            "local": true,
        },
        "global.profileLinks": {
            "type": "option",
            "default": "osekai",
            "options": {
                "osekai": {
                    "title": "Osekai"
                },
                "osu": {
                    "title": "osu!"
                }
            },
            "title": "Profile links",
            "description": "Where to go when visiting a player link",
            "optionType": "fieldset",
            "local": true,
        }
    }
    inputs = {
        "boolean": (callback, defaultValue) => {
            let input = D2.CustomPlus("input", "toggle", {
                "type": "checkbox"
            });
            input.checked = defaultValue;

            input.addEventListener("change", () => {
                callback(input.checked);
            });

            return input;
        },
        "option": (callback, defaultValue, options) => {
            let name = "option-" + Math.random().toString(36).slice(2);

            let fieldset = D2.Fieldset("", () => {
                for (let key in options) {
                    let optionData = options[key];
                    let id = name + "-" + key;

                    D2.Div("", () => {
                        let input = D2.CustomPlus("input", "", {
                            "type": "radio",
                            "name": name,
                            "id": id,
                            "value": key
                        });
                        if (key === defaultValue) input.checked = true;

                        input.addEventListener("change", () => {
                            if (input.checked) callback(key);
                        });

                        D2.Label(id, () => {
                            D2.Text("span", optionData.title);
                        });
                    })
                }
            });

            return fieldset;
        }
    }
    constructor() {
        let outer = document.getElementById("settings-v2-outer");
        for(let setting in this.settings) {
            let settingData = this.settings[setting];
            let inputType = settingData.type;
            let input = this.inputs[inputType];
            let defaultValue = GetSetting(setting, settingData.default, settingData.local);
            let callback = (value) => {
                SetSettings(setting, value, settingData.local);
            };
            let inputEl = input(callback, defaultValue, settingData.options);
            let div = D2.Div("setting", () => {
                D2.Div("info", () => {
                    D2.Text("h3", settingData.title);
                    D2.Text("h5", settingData.description);
                })
                D2.Div("inputarea", () => [
                    inputEl
                ])
            })

            outer.appendChild(div);
        }
    }


}

export class Navbar {
    constructor() {
        this.settings = new Settings();
    }
}