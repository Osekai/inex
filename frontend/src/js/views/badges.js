import "../../css/views/badges.css";
import {DoRequest} from "../utils/requests";
import * as DOM from "../utils/dom";
import {LucideIcon} from "../utils/dom";
import {getParam, getSections, insertParam, removeParam, removeSection, setSections} from "../utils/urlQuery";
import {timeAgo} from "../utils/timeago";
import {SetTooltip} from "../utils/tooltip";
import {debounce} from "../utils/debounce";

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
    document.getElementById("badge-achieved").innerText = timeAgo.format(new Date(badge.First_Date_Awarded));
    SetTooltip(document.getElementById("badge-achieved"), badge.First_Date_Awarded, "bottom");

    document.getElementById("badge-sidebar").classList.add("open");
}

var sorting = getParam("sort", "date-achieved");
var dir = getParam("dir", "asc");
var searchText = "";

var ascendButton = document.getElementById("ascend-button");

function updateAscend() {
    ascendButton.innerHTML = "";
    if (dir == "asc") {
        ascendButton.appendChild(LucideIcon("arrow-down-a-z"));
        SetTooltip(ascendButton, "Ascending", "bottom");
        removeParam("dir");
    } else {
        ascendButton.appendChild(LucideIcon("arrow-up-a-z"));
        SetTooltip(ascendButton, "Descending", "bottom");
        insertParam("dir", dir, false);
    }
    renderVisibleItems()
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

function getRowInfo() {


    try {
        const badges = document.querySelectorAll(".badges__badge");
        let minHeight = Infinity;
        let firstRowY = null;
        let itemsPerRow = 0;

        badges.forEach((badge, index) => {
            const rect = badge.getBoundingClientRect();
            const height = rect.height;

            if (height < minHeight) {
                minHeight = height;
            }

            if (firstRowY === null) {
                firstRowY = rect.top;
                itemsPerRow = 1;
            } else if (rect.top === firstRowY) {
                itemsPerRow++;
            }
        });

        const rowHeight = (minHeight === Infinity ? null : minHeight);
        if (rowHeight !== null) saveRowHeight = rowHeight;
        if (itemsPerRow > 0) saveItemsPerRow = itemsPerRow;

        return {rowHeight, itemsPerRow};

    } catch {
        return {rowHeight: null, itemsPerRow: null};
    }
}

function getRowHeight() {
    var {rowHeight, itemsPerRow} = getRowInfo();
    return rowHeight;
}


function renderVisibleItems(newStyle = false) {
    if (items == null) return; // waiting!

    var cleanedItems = [];
    var _cleanedItems = items.sort((_a, _b) => {
        var a = _a;
        var b = _b;
        if (dir === "desc") {
            a = _b;
            b = _a;
        }

        if (sorting === "date_achieved") {
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


    for (var item of _cleanedItems) {
        if (searchText == "" || item.Name.includes(searchText) || item.Description.includes(searchText)) {
            cleanedItems.push(item);
        }
    }

    var reprocessAfterwards = false;


    if (newStyle == true) {
        saveRowHeight = null;
        saveItemsPerRow = null;
        grid.innerHTML = "";
    }

    var {rowHeight, itemsPerRow} = getRowInfo();
    console.log("row height " + rowHeight);
    if (rowHeight == null) {
        reprocessAfterwards = true;
        rowHeight = 20; // fix it in a sec
        itemsPerRow = 10;
    }

    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;

    const totalRows = Math.ceil(cleanedItems.length / itemsPerRow);
    const fullHeight = totalRows * rowHeight;
    spacer.style.height = `${fullHeight}px`;

    // Start row now considers topBuffer
    const startRow = Math.max(0, Math.floor((scrollTop - (topBuffer * rowHeight)) / rowHeight));
    const visibleRows = Math.ceil(windowHeight / rowHeight) + buffer;
    const startIdx = startRow * itemsPerRow;
    const endIdx = Math.min(startIdx + visibleRows * itemsPerRow, cleanedItems.length);

    const visibleItems = cleanedItems.slice(startIdx, endIdx);
    grid.style.transform = `translateY(${startRow * rowHeight}px)`;
    grid.innerHTML = '';

    for (var i in displayTypes) {
        grid.classList.remove(i);
    }
    grid.classList.add(currentDisplayType);

    for (let item of visibleItems) {
        const el = DOM.Div('div', 'badges__badge');

        el.appendChild(DOM.Image(item.Image_URL))
        if (currentDisplayType !== "compact") {
            el.appendChild(DOM.Text("h4", item.RealName))
            el.appendChild(DOM.Text("h1", item.Description))
            el.appendChild(DOM.Text("h3", item.Users.length + " player" + (item.Users.length === 1 ? "" : "s")));

        }
        if (item === currentBadge) {
            el.classList.add("active");
        }

        el.addEventListener("click", () => {
            showBadge(item, el);
        })

        grid.appendChild(el);
    }
    if (reprocessAfterwards) {
        console.log("again again!");
        document.querySelectorAll(".badges__badge img")[0].addEventListener("load", () => {
            renderVisibleItems();
        })
    }
}

window.addEventListener('scroll', () => {
    requestAnimationFrame(renderVisibleItems);
});

window.addEventListener('resize', () => {
    renderVisibleItems();
});

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
        SetTooltip(div, displayTypes[type].name);
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


    items = await DoRequest("/api/badges/get_all");
    items = items.content;
    renderVisibleItems();
    checkHistory();
    grid.classList.add("loaded");
    document.getElementById("grid-loader").classList.add("loaded"); // we wait.

    search();
}

var searchBar: HTMLInputElement = document.getElementById("badge_search");
const search = debounce(() => {
    console.log("gm");
    searchText = searchBar.value;
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
        renderVisibleItems();


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
