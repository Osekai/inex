import "../../css/views/profiles_home.css";
import {DoRequest} from "../utils/requests";
import {D2} from "../utils/d2";
import {formatNumber} from "../utils/numbers";

const SEARCH_DELAY = 300;
const MIN_LENGTH = 2;

let input = document.querySelector("[pr-el=search-input]");
let results = document.querySelector("[pr-el=search-results]");

let timer = null;
// answers can come back out of order, only the newest one counts
let searchId = 0;

function userRow(id, name, extra, rank = null) {
    return D2.DivLink("/profiles/" + id, "profile-row", () => {
        if (rank !== null) {
            D2.Text("span", "#" + rank, "profile-row-rank");
        }
        D2.Image("", "https://a.ppy.sh/" + id);
        D2.Text("p", name);
        D2.Text("small", extra);
    });
}

function message(text) {
    return D2.Text("p", text, "profile-search-message");
}

function hideResults() {
    results.classList.add("hidden");
    results.innerHTML = "";
}

async function search(query) {
    let id = ++searchId;
    let response = await DoRequest("GET", "/api/profiles/search?query=" + encodeURIComponent(query));
    if (id !== searchId) return;

    results.innerHTML = "";
    if (response.success !== true) {
        results.appendChild(message(response.message));
        results.classList.remove("hidden");
        return;
    }

    if (response.content.length == 0) {
        results.appendChild(message("No users found"));
    }
    for (let user of response.content) {
        let row = userRow(user.id, user.username, user.country_code);
        results.appendChild(row);
    }
    results.classList.remove("hidden");
}

input.addEventListener("input", () => {
    clearTimeout(timer);
    let query = input.value.trim();
    if (query.length < MIN_LENGTH) {
        searchId++;
        hideResults();
        return;
    }
    timer = setTimeout(() => {
        search(query);
    }, SEARCH_DELAY);
});

input.addEventListener("focus", () => {
    if (results.children.length > 0) results.classList.remove("hidden");
});

document.addEventListener("click", (e) => {
    if (e.target.closest(".profile-search")) return;
    results.classList.add("hidden");
});

async function fillList(attr, url, extra) {
    let list = document.querySelector("[pr-el=" + attr + "]");
    if (!list) return;

    let response = await DoRequest("GET", url);
    list.innerHTML = "";

    if (response.success !== true || response.content.length == 0) {
        list.appendChild(message("Nothing here yet"));
        return;
    }

    for (let user of response.content) {
        let extraText = "";
        if (extra) {
            extraText = extra(user);
        }
        list.appendChild(userRow(user.User_ID, user.Name ?? ("User " + user.User_ID), extraText));
    }
}

fillList("most-viewed", "/api/profiles/visits/most?days=14");
fillList("recently-viewed", "/api/profiles/visits/recent");

// the leaderboard, mode "" is all mode and only matters for pp
let leaderboardType = "pp";
let modeSelector = document.querySelector("[pr-el=leaderboard-mode]");
let leaderboardRequest = 0;

async function loadLeaderboard() {
    let list = document.querySelector("[pr-el=leaderboard]");
    let type = leaderboardType;
    let mode = modeSelector.value;
    let id = ++leaderboardRequest;

    let response = await DoRequest("GET", "/api/profiles/leaderboard?type=" + type + "&mode=" + mode);

    // ignore answers for something they've already switched away from
    if (id !== leaderboardRequest) return;

    list.innerHTML = "";
    if (response.success !== true || response.content.length == 0) {
        list.appendChild(message("Nothing here yet"));
        return;
    }

    for (let user of response.content) {
        let value = formatNumber(user.Value) + (type == "medals" ? " medals" : "pp");
        list.appendChild(userRow(user.ID, user.Name, value, user.Rank));
    }
}

modeSelector.addEventListener("change", () => {
    loadLeaderboard();
});

let tabs = document.querySelectorAll("[pr-el=leaderboard-tab]");
for (let tab of tabs) {
    tab.addEventListener("click", () => {
        leaderboardType = tab.getAttribute("leaderboard-type");
        for (let other of tabs) {
            other.classList.toggle("active", other == tab);
        }
        // modes only make sense for pp
        modeSelector.style.display = leaderboardType == "pp" ? "" : "none";
        loadLeaderboard();
    });
}

loadLeaderboard();
