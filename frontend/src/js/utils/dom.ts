export function BlurAll() {
    var tmp = document.createElement("input");
    document.body.appendChild(tmp);
    tmp.style.position = "fixed";
    tmp.focus();
    document.body.removeChild(tmp);
}

export function Text(type: string, text: string) {
    return Object.assign(document.createElement(type), {"innerText": text});
}

export function Image(link: string, classname: string, lazy = false) {
    if (lazy) {
        var img = Object.assign(document.createElement("img"), {"className": classname});
        img.setAttribute("data-src", link);
        img.classList.add("lazy");
        return img;
    } else {
        return Object.assign(document.createElement("img"), {"className": classname, "src": link});
    }
}

export function Div(type = "div", className = "") {
    return Object.assign(document.createElement(type), {"className": className});
}

export function AntheraIcon(icon: string) {
    var i = Object.assign(document.createElement("i"));
    i.classList.add(icon);
    return i;
}

export function SimpleIcon(icon: string) {
    var i = Object.assign(document.createElement("i"));
    i.setAttribute("simple-icon", icon);
    return i;
}

export function LucideIcon(icon: string) {
    var i = Object.assign(document.createElement("i"));

    i.setAttribute("data-lucide", icon);
    return i;
}

function InteractableBase(text: string, type = "", basetype: string, element = "button") {
    var inelement = null;
    if (typeof (text) != "string") {
        inelement = text;
        text = "";
    }
    var button = Object.assign(document.createElement(element), {
        "className": basetype + " " + type,
        "innerText": text
    });
    if (inelement != null) button.appendChild(inelement);
    return button;
}

export function Button(text: string, type = "") {
    return InteractableBase(text, type, "button");
}

export function IconButton(icon: string, text: string, type = "", buttontype = "button icon-button") {
    var button = InteractableBase("", type, buttontype);
    var icon_el = LucideIcon(icon);

    var text_el = Text("p", text);
    button.appendChild(icon_el);
    button.appendChild(text_el);
    return button;
}

export function Input(text: string, type = "", content = "") {
    var input = Object.assign(document.createElement("input"), {
        "className": "input " + type,
        "placeholder": text,
        "value": content,
        type: type
    });
    if (type == "date") {
        input.valueAsDate = new Date(content);
    }
    return input;
}

export function InputText(text: string, type = "", content = "") {
    var header = Text("h3", text);
    var input = Input(text, type, content);

    var container = Div();
    container.appendChild(header);
    container.appendChild(input);
    return {
        element: container,
        value: () => {
            return input.value
        }
    };
}

export function InputTextarea(text: string, type = "", content = "") {
    var header = Text("h3", text);
    var input : HTMLElement = null;
    if (type == "code") {
        input = document.createElement("advanced-code-field");
        input.addEventListener("finishevent", () => {
            // @ts-ignore
            input.setValue(content);
        })
    } else {
        input = Object.assign(document.createElement("textarea"), {
            "className": "input " + type,
            "placeholder": text,
            "value": content
        });
    }

    var container = Div();
    container.appendChild(header);
    container.appendChild(input);
    return {
        element: container,
        value: () => {
            if(type == "code") {
                // @ts-ignore
                return input.getValue();
            }
            // @ts-ignore
            return input.value
        }
    };
}

export function Checkbox(text: string, value: boolean | number) {
    var random = (Math.random() * 999999);
    var input = Object.assign(document.createElement("input"), {
        "className": "checkbox",
        "type": "checkbox",
        "name": random,
        "value": value
    });
    var label = Object.assign(document.createElement("label"), {
        "for": random,
        "innerText": text
    });

    var outer = Div("div", "toggle-text");
    outer.appendChild(input);
    outer.appendChild(label);
    return {
        element: outer,
        value: () => {
            if (input.value == true || input.value == false) return input.value;
            return input.value == 1;
        }
    };
}

export function TextArea(text: string, rows = 2, content = "") {
    return Object.assign(document.createElement("textarea"), {
        rows,
        "className": "input",
        "placeholder": text,
        "value": content
    });
}

export function InputWaiter(text: string, type = "", content = "", callback = () => {
}, hitCallback = () => {
}) {
    var object = Object.assign(document.createElement("input-waiter"), {"placeholder": text, "value": content});
    // @ts-ignore
    object.input.value = content;
    // @ts-ignore
    object.doneCallback = callback;
    // @ts-ignore
    object.hitCallback = hitCallback;
    return object;

    // :(
}

export function cloneAttributes(source: any, target: any) {
    [...source.attributes].forEach(attr => {
        target.setAttribute(attr.nodeName === "id" ? 'data-id' : attr.nodeName, attr.nodeValue)
    })
}


