import "../../css/views/rankings.css";
import {D2} from "../utils/d2";
import {getParam, getSections, insertParam, removeParam} from "../utils/urlQuery";
import {DoRequestCache} from "../utils/requests";
import {Clubs} from "../utils/clubs";
import {columnTypes, types} from "./rankings/RankingsUtils";
import {LoaderPanelOverlay} from "../ui/loader-panel-overlay";



let currentCategory = null;
let currentOptions = {};
let currentPage = 0;
const limit = 50;

const topPagination = document.querySelector('pagination-el[primary]');
const bottomPagination = document.querySelector('pagination-el:not([primary])');
const searchBar = document.getElementById("search-bar");

// === UTILITY FUNCTIONS ===

function autoParam(key, val, def = "") {
    if (val === def || val === "" || val === null || val === undefined) {
        removeParam(key);
    } else {
        insertParam(key, val);
    }
}

// === PAGINATION HELPERS ===

function updateBothPaginations(maxPages) {
    if (topPagination && topPagination.maxPages !== maxPages) {
        topPagination.maxPages = maxPages;
    }
    if (bottomPagination && bottomPagination.maxPages !== maxPages) {
        bottomPagination.maxPages = maxPages;
    }
}

function setBothPaginationPages(page) {
    if (topPagination) topPagination.setPage(page);
    if (bottomPagination) bottomPagination.setPage(page);
}

function initializeBothPaginations(maxCount) {
    if (maxCount !== 0) {
        if (topPagination) topPagination.initialize(limit, maxCount);
        if (bottomPagination) bottomPagination.initialize(limit, maxCount);
    }
}

// === API REQUEST HELPERS ===

async function fetchRankingsData(offset = 0) {
    if (!currentCategory) return null;

    if(currentOptions.query == "") currentOptions.query = null;

    return await DoRequestCache("POST", "/api/rankings/get", {
        offset,
        type: currentCategory.key,
        options: currentOptions
    }, 5);
}

// === TABLE RENDERING ===

function getColumnLabel(colDef, firstItem) {
    if (firstItem) {
        let firstItemData = colDef.data(firstItem, currentOptions);
        if (firstItemData.label) return firstItemData.label;
    }

    const typeLabels = {
        user: "User",
        text: "Text",
        medal: "Medal",
        scoreGraph: "Graph"
    };

    return typeLabels[colDef.type] || "Column";
}

function createTableHeader(columns, data) {
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    for (let colDef of columns) {
        const th = document.createElement("th");
        th.textContent = getColumnLabel(colDef, data[0]);
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    return thead;
}

function createTableBody(columns, data) {
    const tbody = document.createElement("tbody");

    for (let item of data) {
        const row = document.createElement("tr");

        for (let colDef of columns) {
            const td = document.createElement("td");
            const colData = colDef.data(item, currentOptions);

            if (columnTypes[colDef.type]) {
                td.appendChild(columnTypes[colDef.type](colData));
            } else {
                td.textContent = "Unknown column type";
            }

            row.appendChild(td);
        }

        tbody.appendChild(row);
    }

    return tbody;
}

function renderTable(data, columns) {
    const table = document.createElement("table");
    table.className = "ranking-table";
    table.appendChild(createTableHeader(columns, data));
    table.appendChild(createTableBody(columns, data));
    return table;
}

// === PAGE LOADING ===

let isLoading = false;

async function LoadPage(page = 0, fromPagination = true) {
    if (!currentCategory || isLoading) return;

    isLoading = true;
    currentPage = page;

    const tableArea = document.getElementById("ranking-table-area");
    tableArea.innerHTML = "";
    tableArea.appendChild(LoaderPanelOverlay());

    const response = await fetchRankingsData(currentPage * limit);

    if (!response?.content?.data) {
        isLoading = false;
        return;
    }

    const data = response.content.data;

    if (data.length === 0) {
        tableArea.innerHTML = "";
        tableArea.appendChild(D2.Div("ranking-empty", () => {
            D2.Text("p", "No results found");
        }));
        isLoading = false;
        return;
    }

    tableArea.innerHTML = "";
    tableArea.appendChild(renderTable(data, currentCategory.value.columns));

    const maxPages = Math.ceil(response.content.max / limit) - 1;
    updateBothPaginations(maxPages);

    if (!fromPagination) {
        setBothPaginationPages(currentPage);
    }

    isLoading = false;
}

async function updatePaginationMaxCount() {
    if (!currentCategory) return;

    const response = await fetchRankingsData(0);
    const maxCount = response?.content?.max || 0;
    const maxPages = Math.ceil(maxCount / limit) - 1;

    updateBothPaginations(maxPages);
}

// === OPTIONS INITIALIZATION ===

function getDefaultOption(optDef) {
    return Object.keys(optDef.options)[0];
}

function createToggleOption(key, optDef) {
    const div = document.createElement("div");
    div.className = "option-group";

    for (let optKey in optDef.options) {
        const labelText = optDef.options[optKey].label;
        const randomId = `opt-${key}-${Math.floor(Math.random() * 1000000)}`;

        const input = document.createElement("input");
        input.type = "radio";
        input.name = key;
        input.value = optKey;
        input.id = randomId;
        input.checked = (optKey === currentOptions[key]);

        input.addEventListener("change", (e) => {
            currentOptions[key] = e.target.value;
            autoParam(key, e.target.value, getDefaultOption(optDef));
            LoadPage(0, false);
        });

        const label = document.createElement("label");
        label.htmlFor = randomId;
        label.textContent = labelText;

        div.appendChild(input);
        div.appendChild(label);
    }

    return div;
}

function InitializeOptions() {
    const categoryType = currentCategory.value;

    if (!currentOptions || Object.keys(currentOptions).length === 0) {
        currentOptions = {};
    }

    // Set defaults for toggle options
    if (categoryType.options) {
        for (let key in categoryType.options) {
            const optDef = categoryType.options[key];

            // read from URL param first
            const urlValue = getParam(key);
            if (urlValue && optDef.options[urlValue]) {
                currentOptions[key] = urlValue;
            } else if (!currentOptions[key]) {
                currentOptions[key] = getDefaultOption(optDef);
            }
        }
    }

    // Render options
    const optionsContainer = document.getElementById("ranking-options-area");
    optionsContainer.innerHTML = "";

    if (categoryType.options) {
        for (let key in categoryType.options) {
            const optDef = categoryType.options[key];
            if (optDef.type === "toggle") {
                optionsContainer.appendChild(createToggleOption(key, optDef));
            }
        }
    }
}

// === SEARCH DROPDOWN ===

function InitializeSearchDropdown() {
    const searchDropdown = document.getElementById("searchtype-dropdown");
    if (!searchDropdown || !currentCategory) return;

    const categoryDef = currentCategory.value;
    const sortItems = (categoryDef.searchable || []).map(n => ({Name: n, Key: n}));

    if (sortItems.length === 0) {
        sortItems.push({Name: "Default", Key: "default"});
    }

    // Determine default index from URL param
    let defaultIndex = 0;
    if (currentOptions.queryColumn) {
        const idx = sortItems.findIndex(x => x.Key === currentOptions.queryColumn);
        if (idx !== -1) defaultIndex = idx;
    }

    searchDropdown.create(
        sortItems,
        "Name",
        defaultIndex,
        "",
        (selectedItem) => {
            currentOptions.queryColumn = selectedItem.Key;
            autoParam("col", selectedItem.Key, sortItems[0].Key);
            LoadPage(0, false);
        }
    );

    // Set default without triggering URL update if not already set
    if (!currentOptions.queryColumn) {
        currentOptions.queryColumn = sortItems[0].Key;
    }
}

// === CATEGORY LOADING ===

async function LoadCategory(category) {
    const categoryType = types[category];
    if (!categoryType) return;

    currentCategory = {key: category, value: categoryType};

    InitializeOptions();
    InitializeSearchDropdown();

    currentPage = 0;

    const response = await fetchRankingsData(0);
    const maxCount = response?.content?.max || 0;

    initializeBothPaginations(maxCount);
    await LoadPage(0, false);
}

// === INITIALIZATION ===


function buildCategoryStructure() {
    const categories = {};

    for (let [key, value] of Object.entries(types)) {
        if (!categories[value.category]) {
            categories[value.category] = [];
        }
        categories[value.category].push({key, name: value.name});
    }

    return categories;
}

function renderCategories(categories) {
    const categoriesEl = document.getElementById("categories");
    const pagesEl = document.getElementById("pages");

    for (let [category, items] of Object.entries(categories)) {
        const catkey = category.toLowerCase().replaceAll(" ", "-");

        //categoriesEl.appendChild(D2.CustomPlus("button", "", {"otab-button": catkey, "otab-no-replace": "no"}, () => {
        //    D2.Text("span", category);
        //}));

        pagesEl.appendChild(D2.CustomPlus("div", "test", {"otab-name": catkey}, () => {
            D2.Text("p", category);
            for (let item of items) {
                D2.CustomPlus("a", "", {"href": "/rankings/" + item.key, "page-button": item.key}, () => {
                    D2.Text("span", item.name);
                });
            }
        }));
    }
}

function setActiveCategory(rankingType) {
    const catkey = types[rankingType].category.toLowerCase().replaceAll(" ", "-");

    setTimeout(() => {
        document.getElementById("categories-outer").switchTab(catkey);
    });

    document.querySelector(`[page-button="${rankingType}"]`).classList.add("active");
}

async function Start() {
    const categories = buildCategoryStructure();
    renderCategories(categories);

    const currentType = getSections("/rankings/{ranking}");
    const q = getParam("q", "");
    const col = getParam("col", null);

    searchBar.value = q;
    currentOptions.query = q;

    if (currentType.ranking) {
        setActiveCategory(currentType.ranking);

        // Set col option before loading category to prevent flicker
        if (col && types[currentType.ranking].searchable?.includes(col)) {
            currentOptions.queryColumn = col;
        }

        await LoadCategory(currentType.ranking);

        // Update dropdown display without triggering change
        if (col && types[currentType.ranking].searchable?.includes(col)) {
            const dropdown = document.getElementById("searchtype-dropdown");
            if (dropdown) dropdown.setValue(col);
        }
    }

    // Only set URL params once at the end
    autoParam("q", searchBar.value.trim(), "");
    if (currentOptions.queryColumn) {
        const categoryDef = types[currentType.ranking];
        const sortItems = (categoryDef?.searchable || []);
        const defaultCol = sortItems[0] || "default";
        autoParam("col", currentOptions.queryColumn, defaultCol);
    }
}

// === EVENT LISTENERS ===

if (topPagination) {
    topPagination.addEventListener("page", (e) => LoadPage(e.page));
}
if (bottomPagination) {
    bottomPagination.addEventListener("page", (e) => LoadPage(e.page));
}

searchBar.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
        const q = searchBar.value.trim();
        currentOptions.query = q;
        autoParam("q", q, "");
        currentPage = 0;
        setBothPaginationPages(0);
        await LoadPage(0, true);
    }
});

Start();
