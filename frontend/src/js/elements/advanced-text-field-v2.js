// ported from anthera (frontend/src/js/elements/advanced-text-field-v2.js)
// the editor is loaded on demand so it doesn't weigh down every page

let urlTabHack = false;

export default class AdvancedTextFieldV2 extends HTMLElement {
    constructor() {
        super();
        this.loaded = false;
        this.finishEvent = new Event("finishevent");
        this.editor = null;
        this.pendingContent = null;
    }

    async init() {
        const [{Editor}] = await Promise.all([
            import("@toast-ui/editor"),
            import("@toast-ui/editor/dist/toastui-editor.css"),
            import("@toast-ui/editor/dist/theme/toastui-editor-dark.css")
        ]);

        // images and links only take urls, no file upload tab
        if (!urlTabHack) {
            urlTabHack = true;
            window.addEventListener("click", () => {
                let element = document.querySelector('.toastui-editor-tabs .tab-item[aria-label="URL"]');
                if (element) {
                    element.click();
                }
                let file = document.querySelector('[aria-label="File"]');
                if (file) {
                    file.style.display = "none";
                }
            });
        }

        this.innerHTML = "<div id='editor'></div>";

        this.editor = new Editor({
            el: this.querySelector("#editor"),
            previewStyle: this.getAttribute("preview-style") || "vertical",
            height: this.getAttribute("height") || "300px",
            initialValue: this.pendingContent ?? "",
            usageStatistics: false,
            theme: "dark"
        });
    }

    connectedCallback() {
        this.innerHTML = "Loading editor...";
        this.init().then(() => {
            this.dispatchEvent(this.finishEvent);
            this.loaded = true;
        });
    }

    getContent() {
        return this.editor ? this.editor.getMarkdown() : "";
    }

    setContent(content) {
        if (content == null) return;
        if (this.editor) {
            this.editor.setMarkdown(content);
        } else {
            // not loaded yet, init picks it up
            this.pendingContent = content;
        }
    }
}

try {
    customElements.define("advanced-text-field-v2", AdvancedTextFieldV2);
} catch (e) {
    // already defined
}
