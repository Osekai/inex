function insertParam(key, value, pushHistory = false) {
    if (!window.history.pushState) {
        return;
    }

    if (!key) {
        return;
    }

    var url = new URL(window.location.href);
    var params = new window.URLSearchParams(window.location.search);
    if (typeof value == 'undefined' || value === null) {

        params.delete(key);
    } else {
        params.set(key, value);
    }

    url.search = params;
    url = url.toString();
    if(pushHistory) {
        window.history.pushState({ url: url }, null, url);
    } else {
        window.history.replaceState({ url: url }, null, url);
    }
}

function getParam(key, fallback) {
    const urlParams = new URLSearchParams(window.location.search);
    if(typeof(urlParams.get(key)) == "undefined" || urlParams.get(key) === null) return fallback;
    return urlParams.get(key);
}

function removeParam(key) {
    if (!window.history.pushState || !key) {
        return;
    }

    var url = new URL(window.location.href);
    var params = new URLSearchParams(window.location.search);

    if (params.has(key)) {
        params.delete(key);
        url.search = params.toString();
        window.history.pushState({ url: url.toString() }, null, url.toString());
    }
}

function getSections(is) {
    var sections = window.location.pathname.split("/");
    var inputSections = is.split("/");

    var resp = {};


    for(var x = 0; x < inputSections.length; x++) {
        var inputSection = inputSections[x];
        var section = sections[x];

        if(inputSection.startsWith("{")) {
            resp[inputSection.slice(1, -1)] = section;
        } else if(inputSection !== section) {
            return null;
        }
    }
    if(typeof(resp) == "undefined") return null;
    return resp;
}

function setSections(is, p) {
    console.log("writing to history", is, p);
    console.trace();
    var sections = window.location.pathname.split("/");
    var inputSections = is.split("/");


    for(var x = 0; x < inputSections.length; x++) {
        var inputSection = inputSections[x];
        var section = sections[x];

        if(inputSection.startsWith("{")) {
            sections[x] = encodeURIComponent(p[inputSection.slice(1, -1)]);
        }
    }
    window.history.pushState({ url: sections.join("/") }, null, sections.join("/"));

}

export { insertParam, getParam, removeParam, getSections, setSections };