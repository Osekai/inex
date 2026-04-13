import {D2} from "../../utils/d2";
import {Clubs} from "../../utils/clubs";

export const helpers = {
    "stdev": {
        "type": "toggle",
        "options": {
            "stdev": {
                "label": "Standard Deviation"
            },
            "total": {
                "label": "Total"
            }
        }
    },

    "user": {
        "type": "user",
        "data": (data) => {
            return {
                "content": {
                    "ID": data.ID,
                    "Name": data.Name,
                    "Country": data.Country_Code
                },
            }
        },
    },
    "rank": {
        "type": "ranktext",
        "data": (data) => {
            return {
                "label": "Rank",
                "content": "#" + data.Rank
            }
        },
    },
}


export const types = {

    "medals_users": {
        "category": "Medals",
        "name": "Users",
        "searchable": [
            "Username",
            "User ID",
            "Rarest Medal",
            "Country"
        ],
        "columns": [
            helpers.rank,
            helpers.user,
            {
                "type": "text",
                "data": (data) => {
                    return {
                        "label": "Medals",
                        "content": data.Count_Medals + " medals"
                    }
                }
            },
            {
                "type": "medal",
                "data": (data) => {
                    return {
                        "label": "Rarest Medal",
                        "content": data.Medal_Data
                    }
                }
            },
            {
                "type": "medalClub",
                "data": (data) => {
                    return {
                        "label": "Club",
                        "content": data.Medal_Percentage
                    }
                }
            }
        ]
    },

    "medals_rarity": {
        "category": "Medals",
        "name": "Rarity",
        "searchable": ["Medal Name"],
        "columns": [
            helpers.rank,
            {
                "type": "medal",
                "data": (data) => {
                    return {
                        "label": null,
                        "content": data
                    }
                }
            },
            {
                "type": "text",
                "data": (data) => {
                    return {
                        "label": "Description",
                        "content": data.Description
                    }
                }
            },
            {
                "type": "text",
                "data": (data) => {
                    return {
                        "label": "held by",
                        "content": data.Frequency*100 + "% (" + data.Count_Achieved_By + " users)"
                    }
                }
            }
        ]
    },

    "pp": {
        "category": "All Mode",
        "name": "PP",
        "searchable": [
            "Username",
            "User ID",
            "Country"
        ],
        "options": {
            "type": helpers.stdev
        },
        "columns": [
            helpers.rank,
            helpers.user,
            {
                "type": "text",
                "data": (data, options) => {
                    return {
                        "label": (options.type === "total" ? "total pp" : "standard deviated pp"),
                        "content": (options.type === "total" ? data.PP_Total : data.PP_Stdev),
                        "labelPosition": "after"
                    }
                }
            },
            {
                "type": "scoreGraph",
                "data": (data, options) => {
                    return {
                        "type": options.type,
                        "values": {
                            "standard": data.PP_Standard,
                            "taiko": data.PP_Taiko,
                            "mania": data.PP_Mania,
                            "catch": data.PP_Catch
                        },
                        "prefix": "pp"
                    }
                }
            }
        ]
    },

    "level": {
        "category": "All Mode",
        "name": "Level",
        "searchable": [
            "Username",
            "User ID",
            "Country"
        ],
        "options": {
            "type": helpers.stdev
        },
        "columns": [
            helpers.rank,
            helpers.user,
            {
                "type": "text",
                "data": (data, options) => {
                    return {
                        "label": (options.type === "total" ? "total level" : "standard deviated level"),
                        "content": (options.type === "total" ? data.Level_Total : data.Level_Stdev),
                        "labelPosition": "after"
                    }
                }
            },
            {
                "type": "scoreGraph",
                "data": (data, options) => {
                    return {
                        "type": options.type,
                        "values": {
                            "standard": data.Level_Standard,
                            "taiko": data.Level_Taiko,
                            "mania": data.Level_Mania,
                            "catch": data.Level_Catch
                        },
                        "prefix": "level"
                    }
                }
            }
        ]
    },

    "accuracy": {
        "category": "All Mode",
        "name": "Accuracy",
        "searchable": [
            "Username",
            "User ID",
            "Country"
        ],
        "options": {
            "type": helpers.stdev
        },
        "columns": [
            helpers.rank,
            helpers.user,
            {
                "type": "text",
                "data": (data, options) => {
                    let label = (options.type === "total" ? "total accuracy" : "standard deviated accuracy");
                    return {
                        "label": label,
                        "content": (options.type === "total" ? data.Accuracy_Total : data.Accuracy_Stdev) + label
                    }
                }
            },
            {
                "type": "scoreGraph",
                "data": (data, options) => {
                    return {
                        "type": options.type,
                        "values": {
                            "standard": data.Accuracy_Standard,
                            "taiko": data.Accuracy_Taiko,
                            "mania": data.Accuracy_Mania,
                            "catch": data.Accuracy_Catch
                        },
                        "prefix": "accuracy"
                    }
                }
            }
        ]
    },

    "replays": {
        "category": "All Mode",
        "name": "Replays",
        "searchable": [
            "Username",
            "User ID",
            "Country"
        ],
        "columns": [
            helpers.rank,
            helpers.user,
            {
                "type": "text",
                "data": (data) => {
                    return {
                        "label": "replays watched",
                        "content": data.Count_Replays_Watched + " replays watched"
                    }
                }
            }
        ]
    },

    "mapsets": {
        "category": "Mappers",
        "name": "Mapsets",
        "searchable": [
            "Username",
            "User ID",
            "Country"
        ],
        "options": {
            "type": {
                "type": "toggle",
                "options": {
                    "ranked": {"label": "Ranked"},
                    "loved": {"label": "Loved"}
                }
            }
        },
        "columns": [
            helpers.rank,
            helpers.user,
            {
                "type": "text",
                "data": (data, options) => {
                    return {
                        "label": (options.type === "ranked" ? "ranked maps" : "loved maps"),
                        "content": (options.type === "ranked" ? data.Count_Maps_Ranked + " ranked maps" : data.Count_Maps_Loved + " loved maps")
                    }
                }
            }
        ]
    },

    "subscribers": {
        "category": "Mappers",
        "name": "Subscribers",
        "searchable": [
            "Username",
            "User ID",
            "Country"
        ],
        "columns": [
            helpers.rank,
            helpers.user,
            {
                "type": "text",
                "data": (data) => {
                    return {
                        "label": "subscribers",
                        "content": data.Count_Subscribers + " subscribers"
                    }
                }
            }
        ]
    },

    "badges": {
        "category": "Badges",
        "name": "Badges",
        "searchable": [
            "Username",
            "User ID",
            "Country"
        ],
        "columns": [
            helpers.rank,
            helpers.user,
            {
                "type": "text",
                "data": (data) => {
                    return {
                        "label": "badges",
                        "content": data.Count_Badges + " badges"
                    }
                }
            }
        ]
    }

};


export const columnTypes = {
    "user": (data) => {
        return D2.CustomPlus("a", "coltype-user", {href: "https://osu.ppy.sh/u/" + data.content.ID}, () => {
            D2.Image("pfp", "https://a.ppy.sh/" + data.content.ID);
            D2.Image("flag", "/assets/flags/1x1/" + data.content.Country.toLowerCase() + ".svg");
            D2.Text("p", data.content.Name);
        })
    },
    "text": (data) => {
        return D2.Div("coltype-text", () => {
            D2.Text("p", data.content);
        })
    },
    "ranktext": (data) => {
        return D2.Div("coltype-ranktext", () => {
            D2.Text("p", data.content);
        })
    },
    "medal": (data) => {
        let el = D2.CustomPlus("a", "coltype-medal", {href: "/medals/" + encodeURIComponent(data.content.Name)}, () => {
            D2.Image("medal", "/assets/osu/web/" + data.content.Link)
            D2.Text("p", data.content.Name);
        })
        if (data.label) el.setAttribute("tooltip", data.label ?? null)
        if (data.label) el.setAttribute("tooltip-cont", data.label ?? null)
        return el
    },
    "scoreGraph": (data) => {
        return D2.Div("coltype-scoregraph", () => {
            let type = data.type
            let v = data.values

            let s = v.standard
            let t = v.taiko
            let c = v.catch
            let m = v.mania

            let weights

            if (type === "total") {
                weights = {
                    standard: Math.abs(s),
                    taiko: Math.abs(t),
                    catch: Math.abs(c),
                    mania: Math.abs(m)
                }
            } else {
                let mean = (s + t + c + m) / 4
                weights = {
                    standard: Math.abs(s - mean),
                    taiko: Math.abs(t - mean),
                    catch: Math.abs(c - mean),
                    mania: Math.abs(m - mean)
                }
            }

            let total = weights.standard + weights.taiko + weights.catch + weights.mania
            if (!total) total = 1

            let modes = [
                ["standard", "gamemode-osu"],
                ["taiko", "gamemode-taiko"],
                ["catch", "gamemode-catch"],
                ["mania", "gamemode-mania"]
            ]

            for (let [k, cls] of modes) {
                let pct = (weights[k] / total) * 100
                let bar = D2.Div(cls)
                bar.style.width = pct + "%"
                bar.setAttribute("tooltip", `${v[k]} ${data.prefix}`)
            }
        })
    },
    "medalClub": (data) => {
        return D2.Div(("coltype-medalclub " + Clubs.GetClubClass(Clubs.GetClub(data.content))), () => {
            let inner = D2.Div("bar-inner");
            inner.style.width = (data.content) + "%";
            D2.Text("p", data.content + "%");
        })
    }
}