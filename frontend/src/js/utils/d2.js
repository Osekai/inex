import {getMousePosition} from "./mouse";
import {IconButton} from "./dom";

export class D2 {
    static _currentParent = null;

    static _appendChildren(parent, children) {
        if (typeof children === "function") {
            const prevParent = D2._currentParent;
            D2._currentParent = parent;
            const ret = children();
            if (ret instanceof Node) {
                parent.appendChild(ret);
            } else if (Array.isArray(ret)) {
                for (const child of ret) {
                    if (child instanceof Node) parent.appendChild(child);
                }
            }
            D2._currentParent = prevParent;
        } else if (Array.isArray(children)) {
            for (const child of children) {
                D2._appendChildren(parent, child);
            }
        } else if (children instanceof Node) {
            parent.appendChild(children);
        } else if (typeof children === "string" || typeof children === "number") {
            parent.appendChild(document.createTextNode(children));
        }
    }


    static _createElement(tag, className = "", children) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        D2._appendChildren(el, children);
        if (D2._currentParent) {
            D2._currentParent.appendChild(el);
        }
        return el;
    }

    static Div(className, children) {
        return D2._createElement("div", className, children);
    }

    static DivLink(link, className, children) {
        var el = D2._createElement("a", className, children);
        el.href = link;
        return el;
    }

    static Image(className, src, children) {
        const img = D2._createElement("img", className, children);
        img.src = src;
        return img;
    }
    static LazyImage(className, src, baseSrc, children) {
        const img = D2._createElement("img", className, children);
        img.setAttribute("data-src", src);
        img.src = baseSrc;
        img.classList.add("lazy");
        return img;
    }

    static Icon(name, children) {
        const icon = D2._createElement("i", `icon ${name}`, children);
        icon.setAttribute("data-lucide", name);
        return icon;
    }

    static Custom(tag, className, children) {
        return D2._createElement(tag, className, children);
    }

    static CustomPlus(tag, className, attr, children) {
        var el = D2._createElement(tag, className, children);
        if (attr) {
            for (let key in attr) {
                el.setAttribute(key, attr[key]);
            }
        }
        return el;
    }

    static Text(tag, text, className = "") {
        const el = document.createElement(tag);
        el.innerText = text;
        if (className) el.className = className;
        if (D2._currentParent) D2._currentParent.appendChild(el);
        return el;
    }

    static OTabButton(text, page) {
        const button = D2.Custom("button", "tab");
        button.innerText = text;
        button.setAttribute("otab-button", page);
        return button;
    }

    static OTabPage(className, page, children) {
        const pageEl = D2.Div(className);
        pageEl.setAttribute("otab-name", page);
        if (children) D2._appendChildren(pageEl, children);
        return pageEl;
    }

    static OTabArea(className, name, defaultPage, options, children) {
        const area = D2.Div(className);
        area.setAttribute("otab-no-replace", "");
        area.setAttribute("otab-default", defaultPage);
        area.setAttribute("otab-container", name);
        for (var option of options) {
            area.setAttribute(option, "");
        }
        if (children) D2._appendChildren(area, children);
        return area;
    }

    static AntheraIcon(icon) {
        const i = document.createElement("i");
        i.setAttribute("anthera-icon", icon);
        if (D2._currentParent) D2._currentParent.appendChild(i);
        return i;
    }

    static SimpleIcon(icon) {
        const i = document.createElement("i");
        i.setAttribute("simple-icon", icon);
        if (D2._currentParent) D2._currentParent.appendChild(i);
        return i;
    }

    static BaseIcon(icon) {
        const i = document.createElement("i");
        i.classList.add(icon);
        if (D2._currentParent) D2._currentParent.appendChild(i);
        return i;
    }

    static Button(text, type = "") {
        return D2._interactableBase(text, type, "button");
    }

    static IconButton(icon, text, type = "", buttonType = "button icon-button") {
        const button = D2._interactableBase("", type, buttonType);
        const iconEl = D2.LucideIcon(icon);
        button.appendChild(iconEl);
        if (text !== "") {
            const textEl = D2.Text("p", text);
            button.appendChild(textEl)
        }
        return button;
    }

    static Input(placeholder = "", type = "text", value = "") {
        const input = document.createElement("input");
        input.className = "input " + type;
        input.placeholder = placeholder;
        input.value = value;
        input.type = type;
        if (D2._currentParent) D2._currentParent.appendChild(input);
        return input;
    }

    static TextArea(placeholder, rows = 2, value = "") {
        const textarea = document.createElement("textarea");
        textarea.className = "input";
        textarea.placeholder = placeholder;
        textarea.value = value;
        textarea.rows = rows;
        if (D2._currentParent) D2._currentParent.appendChild(textarea);
        return textarea;
    }

    static InputWaiter(placeholder, type = "", value = "", doneCallback = () => {
    }, hitCallback = () => {
    }) {
        const el = document.createElement("input-waiter");
        el.placeholder = placeholder;
        el.value = value;
        el.input.value = value;
        el.doneCallback = doneCallback;
        el.hitCallback = hitCallback;
        if (D2._currentParent) D2._currentParent.appendChild(el);
        return el;
    }

    static LucideIcon(icon) {
        const i = document.createElement("i");
        i.setAttribute("data-lucide", icon);
        if (D2._currentParent) D2._currentParent.appendChild(i);
        return i;
    }

    static _interactableBase(text, type = "", baseType, tag = "button") {
        const el = document.createElement(tag);
        el.className = `${baseType} ${type}`.trim();

        if (typeof text === "string") {
            el.innerText = text;
        } else {
            el.innerText = "";
            el.appendChild(text);
        }

        if (D2._currentParent) D2._currentParent.appendChild(el);
        return el;
    }

    static Wrap(el) {
        return el;
    }


    static LimitedInput(label, type, limit) {
        var outer = D2.Div("input-limited");
        var input = D2.Input(label, type);
        input.classList.add("slideinput");
        var limitCounter = D2.Text("p", "/" + limit);
        var limitCounterBig = D2.Text("span", "");
        limitCounter.prepend(limitCounterBig);

        outer.appendChild(input);
        outer.appendChild(limitCounter);

        input.addEventListener("input", () => {
            const length = input.value.length;
            limitCounterBig.textContent = length;

            if (length > limit) {
                input.classList.add("invalid");
                input.setCustomValidity(`Input cannot exceed ${limit} characters`);
            } else {
                input.classList.remove("invalid");
                input.setCustomValidity(""); // clear error
            }
        });

        limitCounterBig.textContent = input.value.length;

        return {
            el: outer, input
        };
    }

    static BaseButton(text, className, children = null) {
        const button = document.createElement("button");
        button.className = className;
        button.innerText = text;
        if (D2._currentParent) D2._currentParent.appendChild(button);
        if (children) D2._appendChildren(button, children);
        return button;
    }

    static Copied() {
        const {x, y} = getMousePosition();

        const el = D2.Div("copied-popup", () => {
            D2.Text("p", "copied!");
        });

        el.style.position = "fixed";
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;

        setTimeout(() => {
            el.remove();
        }, 2000)

        return el;
    }


    static IconPicker() {
        const picker = document.createElement("icon-picker");
        if (D2._currentParent) D2._currentParent.appendChild(picker);
        return picker;
    }

    static IconOnlyButton(icon, type = "", buttonType = "button icon-button only-icon-button") {
        return D2.IconButton(icon, "", type, buttonType);
    }

    static Fieldset(className = "", children) {
        const el = document.createElement("fieldset");
        if (className) el.className = className;
        D2._appendChildren(el, children);
        if (D2._currentParent) D2._currentParent.appendChild(el);
        return el;
    }

    static Label(forId = "", children) {
        const el = document.createElement("label");
        if (forId) el.htmlFor = forId;
        D2._appendChildren(el, children);
        if (D2._currentParent) D2._currentParent.appendChild(el);
        return el;
    }

    static Link(text, className = "", link = "") {
        const el = document.createElement("a");
        el.innerText = text;
        if (className) el.className = className;
        if (D2._currentParent) D2._currentParent.appendChild(el);
        el.href = link;
        return el;
    }

    static Loader(small = true) {
        const el = document.createElement("div");
        el.classList.add("loader");
        el.innerHTML = window.be[(small === true ? "loaderSmall" : "loader")];
        if (D2._currentParent) D2._currentParent.appendChild(el);
        return el;
    }


    static LoaderArea() {
        return D2.Div("loader-container", () => {
            D2.Loader(true);
            D2.Text("p", "Loading...");
        })
    }
}
