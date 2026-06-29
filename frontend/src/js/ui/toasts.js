import * as DOM from "../utils/dom.js";
import {Div, LucideIcon} from "../utils/dom.js";

if (typeof (document.toastsEl) == "undefined") {
    document.toastsEl = document.createElement("div");
    document.toasts = [];


    document.toastsEl.classList.add("toasts__area");
    document.body.appendChild(document.toastsEl);
}
const themes = {
    default: {hue: "234", icon: "info", time: 10},
    error: {hue: "0", icon: "circle-slash", time: -1},
    success: {hue: "112", icon: "check", time: 15},
    info: {hue: "234", icon: "info", time: 9},
    warning: {hue: "45", icon: "exclamation-triangle", time: 12}
}


export function PushToast({theme = "default", content = "Unknown", time = null, buttons = {}} = {}) {
    if (typeof (themes[theme]) == "undefined") {
        console.error("Theme " + theme + " does not exist!");
        return;
    }
    var theme = themes[theme];
    if (time == null) {
        time = theme.time;
    }
    var toast = DOM.Div("div", "toasts__toast reset-cols");
    var toastInner = DOM.Div("div", "toasts__toast-inner");
    var icon = LucideIcon(theme.icon)
    var text = Object.assign(document.createElement("p"), {"innerText": content});


    if (time !== null) {
        var loader = document.createElement("div");
        loader.className = "toasts__loader";
        toast.appendChild(loader);

        let startTime = performance.now();
        let duration = time * 1000; // Convert seconds to milliseconds

        function animate() {
            let elapsed = performance.now() - startTime;
            let progress = Math.min(elapsed / duration, 1);
            loader.style.width = 100 - (progress * 100) + "%";

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
    }


    toast.style = "--hue: " + theme.hue + ";"

    function hide(e) {
        if (e !== null && e.target.closest("button")) {
            return;
        }

        toast.style.height = toast.clientHeight + "px";
        setTimeout(() => {
            toast.classList.add("toasts__toast-hide");
            setTimeout(() => {

                toast.remove();
            }, 500);
        }, 20);
    }

    toast.addEventListener("click", hide);
    document.toastsEl.appendChild(toast);
    toastInner.appendChild(icon);
    toastInner.appendChild(text);
    if (time != -1) {
        setTimeout(() => {
            hide(null);
        }, time * 1000);
    }


    var _buttons = Div("div", "buttons");
    for (var button in buttons) {
        var _button = Div("button", "button");
        _button.innerText = button;
        _button.addEventListener("click", buttons[button]);
        _buttons.appendChild(_button);
    }
    toastInner.appendChild(_buttons);

    toast.appendChild(toastInner);
}