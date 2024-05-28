import { GradientBlock } from "../graphics/gradient-block.js";

var gradientblock = new GradientBlock(document.getElementById("testcanvas"), [
    {
        "x": "0%",
        "y": "0%",
        "c": "#ff66aa",
    },
    {
        "x": "100%",
        "y": "100%",
        "c": "#aa66ff",
    },
    {
        "x": "100%",
        "y": "0%",
        "c": "#66aaff",
    },
    {
        "x": "0%",
        "y": "100%",
        "c": "#aaff66",
    },
    {
        "x": "30%",
        "y": "40%",
        "c": "#ffaa66",
    },
    {
        "x": "70%",
        "y": "60%",
        "c": "#66ffaa",
    },
])