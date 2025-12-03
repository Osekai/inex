import "../../css/views/rankings.css";
import {D2} from "../utils/d2";
import {getSections} from "../utils/urlQuery";
import {DoRequest} from "../utils/requests";

const helpers = {
    "stdev": {
        "type": "toggle",
        "options": {
            "total": {
                "label": "Total"
            },
            "stdev": {
                "label": "Stardard Deviation"
            }
        }
    },

    "user": {
        "type": "user",
        "data": (data) => {
            return {
                "content": {
                    "ID": data.ID,
                    "Name": data.Name
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


const types = {

    "medals_users": {
        "category": "Medals",
        "name": "Users",
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
                        "content": data.Medal_Percentage
                    }
                }
            }
        ]
    },

    "medals_rarity": {
        "category": "Medals",
        "name": "Rarity",
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
                        "content": data.Frequency + "% (" + data.Count_Achieved_By + " users)"
                    }
                }
            }
        ]
    },

    "pp": {
        "category": "All Mode",
        "name": "PP",
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


const columnTypes = {
    "user": (data) => {
        console.log(data);
        return D2.CustomPlus("a", "coltype-user", {href: "https://osu.ppy.sh/u/" + data.content.ID}, () => {
            D2.Image("pfp", "https://a.ppy.sh/" + data.content.ID);
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
        return D2.CustomPlus("a", "coltype-medal", {href: "/medals/" + encodeURIComponent(data.content.Name)}, () => {
            D2.Image("medal", "/assets/osu/web/" + data.content.Link)
            D2.Text("p", data.content.Name);
        })
    },
    "scoreGraph": (data) => {
        return D2.Text("p", "TODO");
    },
    "medalClub": (data) => {
        return D2.Text("p", "TODO: " + data.content);
    }
}


let currentCategory = null;
let currentOptions = {};
let currentPage = 0;
let limit = 50; // items per page

const topPagination = document.querySelector('pagination-el[primary]');
const bottomPagination = document.querySelector('pagination-el:not([primary])');

async function LoadPage(page = 0) {
    if (!currentCategory) return;
    currentPage = page;

    let tableArea = document.getElementById("ranking-table-area");
    tableArea.innerHTML = "";

    let response = await DoRequest("POST", "/api/rankings/get", {
        offset: currentPage * limit,
        type: currentCategory.key,
        options: currentOptions
    });

    if (!response || !response.content || !response.content.data) return;

    let data = response.content.data;

    let table = document.createElement("table");
    table.className = "ranking-table";

    // header
    let thead = document.createElement("thead");
    let headerRow = document.createElement("tr");
    for (let colDef of currentCategory.value.columns) {
        let th = document.createElement("th");

        // try to get label from the first data item, fallback to type default
        let label = "";
        if (data.length > 0) {
            let firstItemData = colDef.data(data[0], currentOptions);
            label = firstItemData.label || "";
        }

        if (!label) {
            label = colDef.type === "user" ? "User" :
                colDef.type === "text" ? "Text" :
                    colDef.type === "medal" ? "Medal" :
                        colDef.type === "scoreGraph" ? "Graph" :
                            "Column";
        }

        th.textContent = label;
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);


    // body
    let tbody = document.createElement("tbody");
    for (let item of data) {
        let row = document.createElement("tr");
        for (let colDef of currentCategory.value.columns) {
            let td = document.createElement("td");
            let colData = colDef.data(item, currentOptions);
            if (columnTypes[colDef.type]) {
                let result = columnTypes[colDef.type](colData);
                td.appendChild(result);
            } else {
                td.textContent = "Unknown column type";
            }
            row.appendChild(td);
        }
        tbody.appendChild(row);
    }
    table.appendChild(tbody);

    tableArea.appendChild(table);

    // update max pages if needed
    const maxPages = Math.ceil(response.content.max / limit) - 1;
    if (topPagination && topPagination.maxPages !== maxPages) topPagination.maxPages = maxPages;
    if (bottomPagination && bottomPagination.maxPages !== maxPages) bottomPagination.maxPages = maxPages;

    // set page on paginations without re-initializing
    //if (topPagination) topPagination.setPage(currentPage);
    //if (bottomPagination) bottomPagination.setPage(currentPage);
}


async function LoadCategory(category) {
    let categoryType = types[category];
    if (!categoryType) return;

    currentCategory = {key: category, value: categoryType};

    // default options
    currentOptions = {};
    if (categoryType.options) {
        for (let key in categoryType.options) {
            let optDef = categoryType.options[key];
            if (optDef.type === "toggle") {
                currentOptions[key] = Object.keys(optDef.options)[0];
            }
        }
    }

    // build options UI
    let optionsContainer = document.getElementById("ranking-options-area");
    optionsContainer.innerHTML = "";

    if (categoryType.options) {
        for (let key in categoryType.options) {
            let optDef = categoryType.options[key];
            if (optDef.type === "toggle") {
                let div = document.createElement("div");
                div.className = "option-group";
                div.innerHTML = `<strong>${key}</strong>: `;
                for (let optKey in optDef.options) {
                    let label = optDef.options[optKey].label;
                    let input = document.createElement("input");
                    input.type = "radio";
                    input.name = key;
                    input.value = optKey;
                    input.checked = (optKey === currentOptions[key]);
                    input.addEventListener("change", (e) => {
                        currentOptions[key] = e.target.value;
                        LoadPage(0); // reset to first page when options change
                    });

                    let span = document.createElement("span");
                    span.textContent = label;

                    div.appendChild(input);
                    div.appendChild(span);
                }
                optionsContainer.appendChild(div);
            }
        }
    }

    currentPage = 0;

    // initialize paginations only once
    const response = await DoRequest("POST", "/api/rankings/get", {
        offset: 0,
        type: currentCategory.key,
        options: currentOptions
    });

    const maxCount = response.content?.max || 0;
    if (topPagination) topPagination.initialize(limit, maxCount);
    if (bottomPagination) bottomPagination.initialize(limit, maxCount);

    await LoadPage(0);
}

async function Start() {
    let currentType = getSections("/rankings/{ranking}");
    if (!currentType.ranking) {
        console.log("Ranking homepage, select a category.");
    } else {
        await LoadCategory(currentType.ranking);
    }
}

// hook paginations to update LoadPage
if (topPagination) topPagination.addEventListener("page", (e) => LoadPage(e.page));
if (bottomPagination) bottomPagination.addEventListener("page", (e) => LoadPage(e.page));

Start();

