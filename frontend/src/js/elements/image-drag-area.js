import {LucideIcon} from "../utils/dom";

class ImageArea extends HTMLElement {
    files = []
    allowMultiple = false
    maxSize = "20"
    maxFiles = 1

    el_dragged = null
    el_instructions = null
    dragWhenSet = false;
    preview = true;
    resetFiles() {
        if(this.dragWhenSet) return;
        this.files = [];
        this.el_dragged.classList.add("hidden");
        this.el_instructions.classList.remove("hidden");
    }

    dropHandler(ev) {
        ev.preventDefault();

        this.classList.remove("hover-overlay-active");

        if (ev.dataTransfer.items) {
            // Check if DataTransfer.items is available (Firefox)
            var tmp_files = [...ev.dataTransfer.items].slice(0, this.maxFiles);
            this.files = [];
            [...tmp_files].forEach((item, i) => {
                if (item.kind === 'file') {
                    this.files.push(item.getAsFile());
                }
            });
        } else if (ev.dataTransfer.files) {
            // Fallback for Chrome and other browsers
            this.files = [...ev.dataTransfer.files].slice(0, this.maxFiles);
        }

        const event = new CustomEvent("filedropped", {
            files: this.files
        });
        this.dispatchEvent(event);

        this.updatePreview();
    }

    event = new Event("change");

    updatePreview() {
        this.dispatchEvent(this.event);
        if(this.preview == false) return;
        this.el_dragged.classList.remove("hidden");
        this.el_instructions.classList.add("hidden");
        var preview_container = this.el_dragged.querySelector(".preview-container");
        preview_container.innerHTML = "";
        this.files.forEach((file, i) => {
            if (file instanceof Blob) {
                let img = document.createElement("img");
                img.src = window.URL.createObjectURL(file);
                preview_container.appendChild(img);
            }
            else {
                let img = document.createElement("img");
                img.src = file;
                preview_container.appendChild(img);
            }
        });
    }

    dragEnter(ev) {
        ev.preventDefault();
        this.classList.add("hover-overlay-active");
    }

    dragLeave(ev) {
        ev.preventDefault();
        this.classList.remove("hover-overlay-active");
    }
    pasteHandler(event) {
        if (event.clipboardData.items) {
            // Check if clipboardData.items is available
            var items = event.clipboardData.items;
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    var blob = items[i].getAsFile();
                    if (blob) {
                        this.files = [blob];
                        const event = new CustomEvent("filedropped", {
                            detail: {
                                files: this.files
                            }
                        });
                        this.dispatchEvent(event);
                        this.updatePreview();
                        break; // Stop after the first image is found
                    }
                }
            }
        }
    }

    connectedCallback(props) {
        setTimeout(() => {
            if(this.getAttribute("drag-when-set") != null) this.dragWhenSet = true;
            if(this.getAttribute("preview") === "false") this.preview = false;
            var generate_ui = true;
            if (this.getAttribute("generate_ui") != null && this.getAttribute("generate_ui") == "false") {
                generate_ui = false;
            }
            var that = this;

            var fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.multiple = this.allowMultiple;
            fileInput.style.display = "none";
            fileInput.style.pointerEvents = "none";
            fileInput.addEventListener("change", function (event) {
                // Handle file selection directly within the event listener
                var files = event.target.files;
                if (files.length > 0) {
                    that.files = [...files].slice(0, that.maxFiles);
                    const filedroppedEvent = new CustomEvent("filedropped", {
                        files: that.files
                    });
                    that.dispatchEvent(filedroppedEvent);
                }
                that.updatePreview();
            });

            this.appendChild(fileInput);

            var file_dragged = Object.assign(document.createElement("div"), {"className": "file-dragged hidden"});
            var img = Object.assign(document.createElement("div"), {"className": "preview-container"});
            var remove = Object.assign(document.createElement("a"), {"className": "remove", "innerText": "Remove"});
            remove.addEventListener("click", () => {
                setTimeout(() => {
                    this.resetFiles();
                }, 20)
            })
            file_dragged.appendChild(img);
            file_dragged.appendChild(remove);

            this.appendChild(file_dragged);

            var element = Object.assign(document.createElement("div"), {"className": "center"});

            this.el_instructions = element;
            this.el_dragged = file_dragged;

            if (generate_ui) {
                var icon = LucideIcon("image-plus");
                var texts = Object.assign(document.createElement("div"), {"className": "texts"});

                var h1 = Object.assign(document.createElement("h1"), {"innerText": "Drag image here"});
                var h2 = Object.assign(document.createElement("h2"), {"innerText": "or click here to upload"});
                var h3 = Object.assign(document.createElement("h3"), {"innerHTML": "Max size <strong>" + this.maxSize + "MB</strong> | Max Files " + this.maxFiles});

                texts.appendChild(h1);
                texts.appendChild(h2);
                texts.appendChild(h3);

                var hover_overlay = Object.assign(document.createElement("div"), {"className": "hover-overlay"});
                element.appendChild(hover_overlay);

                var text = Object.assign(document.createElement("h1"), {"innerText": "Drop to upload?"});
                hover_overlay.appendChild(text);

                this.appendChild(element);
                element.appendChild(icon);
                element.appendChild(texts);

            }
            this.addEventListener("dragenter", this.dragEnter);
            this.addEventListener("dragleave", this.dragLeave);
            this.addEventListener("drop", this.dropHandler);
            //this.addEventListener("dragdrop", this.dropHandler);

            this.addEventListener("dragover", function (ev) {
                // chrome things
                ev.preventDefault();
            });

            this.addEventListener("click", function () {
                console.log(this.files);
                if(this.files.length === 0)  fileInput.click();
                if(this.dragWhenSet === true) {
                    console.log("probably")
                    fileInput.click();
                }
            });

            if(this.getAttribute("allow-paste") != null) {
                document.addEventListener("paste", function (event) {
                    that.pasteHandler(event);
                });
            }
            if(this.getAttribute("prefill")) {
                this.files = [this.getAttribute("prefill")]
                    this.updatePreview();

            }
        }, 1);
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

customElements.define("image-drag-area", ImageArea);

export default {ImageArea};