
class AdvancedTextField extends HTMLElement {
    constructor() {
        super();
    }

    editor = null
    finishEvent = new Event("finishevent");

    connectedCallback() {
        this.innerHTML = "Loading editor";
        import("@wangeditor/editor")
            .then(({createEditor, createToolbar, i18nChangeLanguage}) => {
                var that = this;

                var toolbar_el = document.createElement("div");
                var editor_el = document.createElement("div");

                toolbar_el.className = "toolbar";
                editor_el.className = "body";

                const editorConfig = {
                    placeholder: 'Type here...',
                    lang: "English",
                    onChange(editor) {
                        const html = editor.getHtml()
                        that.text = html;
                        // You can sync HTML to <textarea>
                    }
                }

                this.editor = createEditor({
                    selector: editor_el,
                    html: '<p><br></p>',
                    config: editorConfig,
                    mode: 'default', // or 'simple'
                })

                const toolbarConfig = {}

                toolbarConfig.excludeKeys = [
                    'fontFamily',
                    'fontSize',
                    'lineHeight',
                    'uploadImage',
                    'uploadVideo',
                    'redo',
                    'undo',
                    'todo',

                ]

                const toolbar = createToolbar({
                    editor: this.editor,
                    selector: toolbar_el,
                    config: toolbarConfig,
                    mode: 'default', // or 'simple'
                })


                this.innerHTML = "";
                this.appendChild(toolbar_el);
                this.appendChild(editor_el);

                i18nChangeLanguage('en')

                this.dispatchEvent(this.finishEvent);
            });
    }

    disconnectedCallback() {

    }

    static get observedAttributes() {
        return [];
    }

    attributeChangedCallback(name, oldValue, newValue) {

    }

    adoptedCallback() {

    }
}
customElements.define("advanced-text-field", AdvancedTextField);

export default {
    AdvancedTextField
};