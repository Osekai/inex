import { createElement } from 'lucide';

export function BlurAll() {
    var tmp = document.createElement("input");
    document.body.appendChild(tmp);
    tmp.style.position = "fixed";
    tmp.focus();
    document.body.removeChild(tmp);
}

export function Text(type, text) {
    return Object.assign(document.createElement(type), {"innerText": text});
}
export function Image(link, classname) {
    return Object.assign(document.createElement("img"), {"className": classname, "src": link});
}

export function Div(type = "div", className= "") {
    return Object.assign(document.createElement(type), {"className": className});
}

export function AntheraIcon(icon) {
    var i = Object.assign(document.createElement("i"));
    i.setAttribute("anthera-icon", icon);
    return i;
}

export function SimpleIcon(icon) {
    var i = Object.assign(document.createElement("i"));
    i.setAttribute("simple-icon", icon);
    return i;
}
export function LucideIcon(icon) {
    console.log("Setting icon to " + icon);
    var i = Object.assign(document.createElement("i"));

    i.setAttribute("data-lucide", icon);
    return i;
}

function InteractableBase(text, type = "", basetype, element = "button") {
    var inelement = null;
    if(typeof(text) != "string") {
        inelement = text;
        text = "";
    }
    var button = Object.assign(document.createElement(element), {"className": basetype + " " + type, "innerText": text});
    if(inelement != null) button.appendChild(inelement);
    return button;
}

export function Button(text, type = "") {
    return InteractableBase(text, type, "button");
}

export function IconButton(icon, text, type = "", buttontype = "button icon-button") {
    var button = InteractableBase("", type, buttontype);
    var icon_el = LucideIcon(icon);

    var text_el = Text("p", text);
    button.appendChild(icon_el);
    button.appendChild(text_el);
    return button;
}

export function Input(text, type = "", content = "") {
    return Object.assign(document.createElement("input"), {"className": "input " + type, "placeholder": text, "value": content, type: type});
}


export function TextArea(text, rows = 2, content = "") {
    return Object.assign(document.createElement("textarea"), {rows, "className": "input", "placeholder": text, "value": content});
}

export function InputWaiter(text, type = "", content = "", callback = () => {}, hitCallback = () => {}) {
    var object = Object.assign(document.createElement("input-waiter"), {"placeholder": text, "value": content});
    object.input.value = content;
    object.doneCallback = callback;
    object.hitCallback = hitCallback;
    return object;
}

export function cloneAttributes(source, target) {
    [...source.attributes].forEach( attr => { target.setAttribute(attr.nodeName === "id" ? 'data-id' : attr.nodeName ,attr.nodeValue) })
}


