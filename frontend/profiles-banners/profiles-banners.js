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
