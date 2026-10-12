import "../../css/views/badges.css";
import {DoRequest} from "../utils/requests";
import * as DOM from "../utils/dom";
import {LucideIcon} from "../utils/dom";
import {getParam, getSections, insertParam, removeParam, removeSection, setSections} from "../utils/urlQuery";
import {UTCify} from "../utils/time";
import {debounce} from "../utils/debounce";
import {D2} from "../utils/d2";

var items = null;


const grid = document.getElementById('grid');
const spacer = document.getElementById('spacer');

const buffer = 5;
const topBuffer = 6;


var saveRowHeight = null;
var saveItemsPerRow = null;


var currentBadge = null;

function showBadge(badge, el = null, updateSection = true) {
    currentBadge = badge;
    for (var b of document.querySelectorAll(".badges__badge.active")) b.classList.remove("active");

    if (currentBadge == null) {
        document.getElementById("badge-sidebar").classList.remove("open");
        if (updateSection) removeSection("/badges/{badge}", "badge");
        return;
    }
    if (updateSection) setSections("/badges/{badge}", {"badge": badge.Name});
    if (el !== null) el.classList.add("active");
    else {
        // TODO: find right element
    }


    document.getElementById("badge-img").src = "";

    document.getElementById("badge-img").src = badge.Image_URL.replace(".png", "@2x.png");
    document.getElementById("badge-img-1x").src = badge.Image_URL;


    document.getElementById("badge-description").innerText = badge.Description;
    document.getElementById("badge-name-real").innerText = badge.RealName;


    document.getElementById("badge-users").innerText = badge.Users.length;
    const firstAwarded = UTCify(badge.First_Date_Awarded);
    document.getElementById("badge-achieved").innerText = D2.TimeRelative(firstAwarded);
    document.getElementById("badge-achieved").setAttribute("tooltip", D2.TimeFull(firstAwarded, {time: "seconds"}));

    var list = document.getElementById("badge-users-list");
    list.innerHTML = "";
    for(let user of badge.Users) {
        var userObj = D2.CustomPlus("a", "badge__user", { "href": "/profiles/" + user.User_ID },() => {
            D2.Image("", "https://a.ppy.sh/" + user.User_ID, null, "", true);
            D2.Text("h3", user.Username);

            const awarded = UTCify(user.Date_Awarded);
            const date = D2.Text("p", D2.TimeFull(awarded), "awarded");
            date.setAttribute("tooltip", D2.TimeFull(awarded, {time: "seconds"}));
        })
        list.appendChild(userObj);
    }

    document.getElementById("badge-sidebar").classList.add("open");
}

const sortTypes = {
    "date_achieved": {
        "defaultDir": "desc",
        "asc": {"icon": "arrow-down-narrow-wide", "label": "Oldest first"},
        "desc": {"icon": "arrow-down-wide-narrow", "label": "Newest first"},
    },
    "name": {
        "defaultDir": "asc",
        "asc": {"icon": "arrow-down-a-z", "label": "A to Z"},
        "desc": {"icon": "arrow-down-z-a", "label": "Z to A"},
    },
    "player_count": {
        "defaultDir": "desc",
        "asc": {"icon": "arrow-down-0-1", "label": "Fewest players first"},
        "desc": {"icon": "arrow-down-1-0", "label": "Most players first"},
    },
};
var sorting = getParam("sort", "date_achieved");
if (!sortTypes[sorting]) {
    sorting = "date_achieved";
}
var dir = getParam("dir", sortTypes[sorting].defaultDir);
if (dir !== "asc" && dir !== "desc") {
    dir = sortTypes[sorting].defaultDir;
}
var searchText = "";

var ascendButton = document.getElementById("ascend-button");

function updateAscend() {
    ascendButton.innerHTML = "";
    const sortType = sortTypes[sorting];

    if (dir === sortType.defaultDir) {
        removeParam("dir");
    } else {
        insertParam("dir", dir, false);
    }

    ascendButton.appendChild(LucideIcon(sortType[dir].icon));
    ascendButton.setAttribute("tooltip", sortType[dir].label);
    listDirty = true;
    renderVisibleItems();
}

updateAscend();
ascendButton.addEventListener("click", () => {
    if (dir === "asc") {
        dir = "desc";
    } else {
        dir = "asc";
    }

    updateAscend();
})

// measures the real row pitch (height + gap) and how many items fit per row
function measureRows() {
    const children = grid.children;
    if (children.length === 0) return false;

    const firstTop = children[0].offsetTop;
    let itemsPerRow = 0;
    let rowPitch = null;

    for (let child of children) {
        if (child.offsetTop === firstTop) {
            itemsPerRow++;
        } else {
            rowPitch = child.offsetTop - firstTop;
            break;
        }
    }

    // only one row rendered, fall back to height + gap
    if (rowPitch === null) {
        const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
        rowPitch = children[0].offsetHeight + gap;
    }

    const changed = rowPitch !== saveRowHeight || itemsPerRow !== saveItemsPerRow;
    saveRowHeight = rowPitch;
    saveItemsPerRow = itemsPerRow;
    return changed;
}

var cleanedItems = [];
var listDirty = true;

// sort + filter, only when sort/dir/search/items actually change
function rebuildList() {
    items.sort((_a, _b) => {
        var a = _a;
        var b = _b;
        if (dir === "desc") {
            a = _b;
            b = _a;
        }

        if (sorting === "date_achieved") {
            if(a.First_Date_Awarded == null || b.First_Date_Awarded == null) return 1;
            const dateA = Date.parse(a.First_Date_Awarded.replace(" ", "T"));
            const dateB = Date.parse(b.First_Date_Awarded.replace(" ", "T"));
            return dateA - dateB;
        }

        if (sorting === "name") {
            return a.Name.localeCompare(b.Name);
        }

        if (sorting === "player_count") {
            return a.Users.length - b.Users.length;
        }

        return 0; // Fallback in case no condition matches
    });

    cleanedItems = [];
    for (var item of items) {
        if (searchText == "" || item.Name.toLowerCase().includes(searchText) || item.Description.toLowerCase().includes(searchText)) {
            cleanedItems.push(item);
        }
    }

    listDirty = false;
    lastStartIdx = -1; // force a dom update
}

// badge elements are built once and reused while scrolling
var elementCache = new Map();

function getBadgeElement(item) {
    if (elementCache.has(item)) {
        return elementCache.get(item);
    }

    const el = DOM.Div('div', 'badges__badge');

    el.appendChild(DOM.Image(item.Image_URL))
    if (currentDisplayType !== "compact") {
        //el.appendChild(DOM.Text("h4", item.RealName))
        el.appendChild(DOM.Text("h1", item.Description))

        el.appendChild(D2.Div("", () => {
            D2.Text("h3", "first awarded " + D2.TimeFull(UTCify(item.First_Date_Awarded)));
            D2.Text("h3", " - " + item.Users.length + " player" + (item.Users.length === 1 ? "" : "s"));
        }))
    }

    el.addEventListener("click", () => {
        if(item === currentBadge) {
            showBadge(null, null, true);
            return;
        }
        showBadge(item, el);
    })

    elementCache.set(item, el);
    return el;
}

var lastStartIdx = -1;
var lastEndIdx = -1;

function renderVisibleItems(newStyle = false, isRemeasure = false) {
    if (items == null) return; // waiting!

    if (newStyle == true) {
        saveRowHeight = null;
        saveItemsPerRow = null;
        elementCache.clear();
        lastStartIdx = -1;
        grid.innerHTML = "";
    }

    if (listDirty) rebuildList();

    for (var i in displayTypes) {
        grid.classList.remove(i);
    }
    grid.classList.add(currentDisplayType);

    let rowHeight = saveRowHeight;
    let itemsPerRow = saveItemsPerRow;
    let needsMeasure = false;

    if (rowHeight == null || itemsPerRow == null) {
        needsMeasure = true;
        rowHeight = displayTypes[currentDisplayType].supposedHeight;
        itemsPerRow = 1;
    }

    // scroll position relative to the top of the grid, not the page
    const spacerTop = spacer.getBoundingClientRect().top + window.scrollY;
    const scrollTop = Math.max(0, window.scrollY - spacerTop);
    const windowHeight = window.innerHeight;

    const totalRows = Math.ceil(cleanedItems.length / itemsPerRow);
    spacer.style.height = `${totalRows * rowHeight}px`;

    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - topBuffer);
    const visibleRows = Math.ceil(windowHeight / rowHeight) + topBuffer + buffer;
    const startIdx = startRow * itemsPerRow;
    const endIdx = Math.min(startIdx + visibleRows * itemsPerRow, cleanedItems.length);

    // same range as last time, nothing to do
    if (startIdx === lastStartIdx && endIdx === lastEndIdx && !needsMeasure) return;
    lastStartIdx = startIdx;
    lastEndIdx = endIdx;

    const visibleElements = [];
    for (let item of cleanedItems.slice(startIdx, endIdx)) {
        const el = getBadgeElement(item);
        if (item === currentBadge) {
            el.classList.add("active");
        } else {
            el.classList.remove("active");
        }
        visibleElements.push(el);
    }

    grid.style.transform = `translateY(${startRow * rowHeight}px)`;
    grid.replaceChildren(...visibleElements);

    // only measure when we don't know the numbers yet (first render, resize, display change)
    // remeasuring while scrolling makes the spacer height jump around
    if (needsMeasure && measureRows() && !isRemeasure) {
        lastStartIdx = -1;
        renderVisibleItems(false, true);
    }
}

var scrollQueued = false;
window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
        scrollQueued = false;
        renderVisibleItems();
    });
}, { passive: true });

window.addEventListener('resize', debounce(() => {
    // column count can change, so remeasure
    saveRowHeight = null;
    saveItemsPerRow = null;
    renderVisibleItems();
}, 50));

var firstGo = false;

function checkHistory() {
    const selectedName = getSections(`/badges/{badge}`)['badge'];
    if (!selectedName) {
        showBadge(null, null, false);
        return;
    }

    const index = items.findIndex(b => b.Name === selectedName);
    if (index === -1) return;

    currentBadge = items[index]; // Set current badge


    showBadge(currentBadge, null, false);
}

window.addEventListener("popstate", checkHistory);

async function init() {
    for (let type in displayTypes) {
        let div = DOM.Div("button", "display-toggle");
        let icon = DOM.LucideIcon(displayTypes[type].icon);
        div.appendChild(icon);
        div.setAttribute("tooltip", displayTypes[type].name);
        displayTypes[type].element = div;

        div.addEventListener("click", () => {
            for (let _type in displayTypes) {
                displayTypes[_type].element.classList.remove("enabled");
            }
            displayTypes[type].element.classList.add("enabled");
            currentDisplayType = type;
            if (type !== "normal") {
                insertParam("display", type);
            } else {
                removeParam("display");
            }

            renderVisibleItems(true);
        })

        if (type === currentDisplayType) {
            div.classList.add("enabled");
        }

        displayToggleArea.appendChild(div);
    }


    items = await DoRequest("POST", "/api/badges/get_all");
    items = items.content;
    listDirty = true;
    renderVisibleItems();
    checkHistory();
    grid.classList.add("loaded");
    document.getElementById("grid-loader").classList.add("loaded"); // we wait.

    search();
}

var searchBar: HTMLInputElement = document.getElementById("badge_search");
const search = debounce(() => {
    searchText = searchBar.value.toLowerCase();
    listDirty = true;
    renderVisibleItems();
    grid.classList.remove("searchbegin");
}, 100);

searchBar.addEventListener("keyup", search)
searchBar.addEventListener("keyup", () => {
    grid.classList.add("searchbegin");
})


function galleryCreateSortDropdown() {
    // ELEMENT has to be of type SEARCHABLE-DROPDOWN !!!
    const sortItems = [
        // TODO: there's some missing here, i think
        {Name: "Date Achieved", Key: "date_achieved"},
        {Name: "Name", Key: "name"},
        {Name: "Player Count", Key: "player_count"},
    ];

    const defaultSortIndex = sortItems.findIndex(item => item.Key === sorting);
    document.getElementById("sort-dropdown").create(sortItems, "Name", defaultSortIndex, "", (i) => {
        if (i === "date_achieved") removeParam("sort"); // default
        else insertParam("sort", i.Key, false);
        sorting = i.Key;
        dir = sortTypes[sorting].defaultDir;
        updateAscend();
    });
}

document.getElementById("close-sidebar").addEventListener("click", () => {
    showBadge(null, null, true);
})
document.getElementById("close-sidebar-2").addEventListener("click", () => {
    showBadge(null, null, true);
})

var displayTypes = {
    "normal": {
        "name": "Normal",
        "icon": "layout-grid",
        "supposedHeight": 180
    },
    "compact": {
        "name": "Compact",
        "icon": "grid-3x3",
        "supposedHeight": 50
    }
}
var displayToggleArea = document.getElementById("display_toggle");
var currentDisplayType = getParam("display", "normal");


galleryCreateSortDropdown();
init();
