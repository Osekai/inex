import {D2} from "../utils/d2";
import {GetSetting, SetSettings} from "../utils/usersettings";
import {DoRequest} from "../utils/requests";
import {Polling} from "../utils/polling";
import {timeAgo, timeAgoApprox} from "../utils/timeago";
import {UTCify} from "../utils/time";

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
        for (let setting in this.settings) {
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


export class Process {
    polling;

    elements = [];
    constructor() {
        let ui = document.getElementById("process-state-ui");

        this.elements['outer'] = D2.Div("process-state-outer", () => {
            this.elements['user'] = D2.Div("process-state-user", () => {
                this.elements['avatar'] = D2.Image("avatar", "https://a.ppy.sh/" + userData.id);
                this.elements['username'] = D2.Text("h1", userData.username);
                this.elements['text-last'] = D2.Text("small", "Last processed ");
            })
            this.elements['next'] = D2.Div("process-state-next", () => {
                this.elements['ring'] = D2.Div("process-state-ring");
                this.elements['texts'] = D2.Div("process-state-texts", () => {
                    this.elements['text-header'] = D2.Text("h1", "You're not in the queue.");
                    this.elements['text-best'] = D2.Text("h2", ":(");
                    this.elements['text-worse'] = D2.Text("small")
                })
            })
            D2.Div("info", () => {
                D2.Icon("info")
                D2.Text("p", "We slowly refresh everyone's osu! data, prioritizing top players first. This shows when yours is next. Changes can take a few hours to appear.")
            })

        })
        ui.appendChild(this.elements['outer']);
        let polling = new Polling(60, async () => {
            console.log("HIII :3");
            let state = await DoRequest("GET", window.be.SCRIPTS_API_URL + "queue/user/" + userData.id);
            console.log(state);
            const start = new Date(state.data.lastProcessed).getTime();
            const end = new Date(state.data.estimatedNext).getTime();

            let percent = Math.min(Math.max((Date.now() - start) / (end - start) * 100, 0), 100);
            if(percent > 99) percent = 99;
            if(percent < 1) percent = 1;
            document.getElementById("process-state-button").style.setProperty("--progress", Math.round(percent) + "%");

            this.elements['ring'].style.setProperty("--progress", Math.round(percent) + "%");
            this.elements['text-header'].innerText = "You're #" + state.data.position + " in the queue.";


            this.elements['text-best'].innerText = "Best case you'll be processed ";
            this.elements['text-worse'].innerText = "Worst case you'll be processed ";
            this.elements['text-worse'].appendChild(D2.Text("span", timeAgoApprox(new Date(UTCify(state.data.due)))));
            this.elements['text-best'].appendChild(D2.Text("span", timeAgoApprox(new Date(UTCify(state.data.estimatedNext)))));

            this.elements['text-last'].innerText = "Last processed ";
            this.elements['text-last'].appendChild(D2.Text("span", timeAgo.format(new Date(UTCify(state.data.lastProcessed)))));
        });

        this.polling = polling;

        document.getElementById("process-state-button").addEventListener("click", () => {
            polling.forceRun();
        })
    }

}

export class Navbar {
    constructor() {
        this.settings = new Settings();
        this.process = new Process();
    }
}

