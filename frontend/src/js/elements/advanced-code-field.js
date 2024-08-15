import {basicSetup, EditorView} from "codemirror"
import {Compartment, EditorState} from "@codemirror/state"
import {html} from "@codemirror/lang-html"
import {dracula} from 'thememirror';

class AdvancedCodeField extends HTMLElement {
    constructor() {
        super();
    }

    editor = null
    view = null
    finishEvent = new Event("finishevent");

    connectedCallback() {
        let language = new Compartment, tabSize = new Compartment

        this.editor = EditorState.create({
            extensions: [
                basicSetup,
                language.of(html()),
                EditorView.lineWrapping,
                tabSize.of(EditorState.tabSize.of(8)),
                dracula
            ]
        })

        this.view = new EditorView({
            state: this.editor,
            parent: this
        })

        this.dispatchEvent(this.finishEvent);

        console.log(this.editor.doc.toString())
    }

    setValue(text) {
        this.view.dispatch({
            changes: {
                from: 0,
                to: this.view.state.doc.length,
                insert: text
            }
        })
    }
    getValue() {
        console.log(this.view.state.doc.toString())
        return this.view.state.doc.toString();
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

customElements.define("advanced-code-field", AdvancedCodeField);

export default {
    AdvancedCodeField
};