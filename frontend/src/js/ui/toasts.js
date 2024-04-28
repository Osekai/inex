import {LucideIcon} from "../utils/dom";

if (typeof (document.toastsEl) == "undefined") {
    document.toastsEl = document.createElement("div");
    document.toasts = [];


    document.toastsEl.classList.add("toasts__area");
    document.body.appendChild(document.toastsEl);
}

var themes = {
    "default": {
        "hue": "234",
        "icon": "info",
        "time": 10
    },
    "error": {
        "hue": "0",
        "icon": "warning",
        "time": -1
    },
    "success": {
        "hue": "112",
        "icon": "check",
        "time": 15
    },
    "info": {
        "hue": "234",
        "icon": "info",
        "time": 9
    },
}

export function PushToast({ theme = "default", content = "Unknown", time = null } = {}) {
    if (typeof (themes[theme]) == "undefined") {
        console.error("Theme " + theme + " does not exist!");
        return;
    }
    var theme = themes[theme];
    if (time == null) {
        time = theme.time;
    }
    var toast = Object.assign(document.createElement("div"), { "className": "toasts__toast reset-cols" });
    var icon = LucideIcon(theme.icon)
    var text = Object.assign(document.createElement("p"), { "innerText": content });

    toast.style = "--hue: " + theme.hue + ";"
    function hide() {
        toast.style.height = toast.clientHeight + "px";
        setTimeout(() => {
            toast.classList.add("toasts__toast-hide");
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 20);
    }
    document.toastsEl.appendChild(toast);
    toast.appendChild(icon);
    toast.appendChild(text);
    if (time != -1) {
        setTimeout(() => {
            hide();
        }, time * 1000);
    }
    toast.addEventListener("click", hide);
}