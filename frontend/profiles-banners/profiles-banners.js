import {io} from "socket.io-client";
import './profiles-banners.css';

import('../src/index').catch(function (e) {
    console.warn("index failed to load in banner", e);
});


let socket = io("http://localhost:35569", {});
socket.connect();

socket.on("css_reload", () => {
    location.reload();
});

socket.on("js_reload", () => {
    location.reload();
});

// live updates from the editor, ported from anthera's theme.update (frontend/src/js/views/me_edit.js)
// only does css variables, anything that changes classes gets a full reload instead
window.addEventListener('message', (event) => {
    if (event.origin !== location.origin) return;
    if (event.data.message !== "banner.update") return;

    let data = event.data.content;

    // replace rather than append, otherwise every slider tick leaks more css
    let css = ":root {\n";
    for (let item in data.settings) {
        let def = data.theme.Settings[item];
        if (!def) continue;

        let out = def['output'];
        if (!out || out['type'] !== 'css-variable') continue;
        let suffix = out['suffix'] ? out['suffix'] : "";

        let value = data.settings[item];
        if (Array.isArray(value)) {
            // gradients get split into -1, -2 etc, same as the php
            for (let i = 0; i < value.length; i++) {
                css += "--dyn-" + item + "-" + (i + 1) + ": " + value[i] + suffix + ";\n";
            }
        } else {
            css += "--dyn-" + item + ": " + value + suffix + ";\n";
        }
    }
    css += "}";

    document.getElementById("dyn-theme").innerHTML = css;
});


// tells the editor the banner is fully drawn, fonts included
window.addEventListener('load', async () => {
    if (window.parent === window) return;
    try {
        await document.fonts.ready;
    } catch (e) {
        // no fonts api, load is good enough
    }
    window.parent.postMessage({"message": "banner.ready"}, location.origin);
});
