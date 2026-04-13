

import { createPopper } from '@popperjs/core';

var first = false;
if (typeof window.clickOffLayer === "undefined") {
    first = true;
    window.clickOffLayer = true;
    window.globalClickoffLayer = document.createElement("div");
    window.globalClickoffLayer.className = "jsdropdown-clickoff-layer jsdropdown-clickoff-layer-closed";
    document.body.appendChild(window.globalClickoffLayer);

    window.globalClickoffLayer.addEventListener("click", () => {
        window.DropdownInstances.forEach((inst) => inst.close());
    });
}

const globalClickoffLayer = window.globalClickoffLayer;

if (!window.DropdownInstances) {
    window.DropdownInstances = [];
}

export class Dropdown {
    constructor(dropdownEl, buttonEl = null) {
        dropdownEl.setAttribute("jsdr-init", "");
        this.dropdown = dropdownEl;
        this.buttons = new Set();
        this.isOpen = false;
        this.bodyClickHandler = null;
        this.originalParent = null;
        this.originalNextSibling = null;
        this.popperInstance = null;

        this.id = dropdownEl.getAttribute("dropdown");
        if (!this.id) {
            this.id = Math.floor(Math.random() * 9_000_000) + "s";
            dropdownEl.setAttribute("dropdown", this.id);
        }

        if (buttonEl && !buttonEl.hasAttribute("dropdown-button")) {
            buttonEl.setAttribute("dropdown-button", this.id);
        }

        this.toggle = this.toggle.bind(this);
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onResize = this.onResize.bind(this);

        const btns = new Set();
        if (buttonEl) btns.add(buttonEl);

        document.querySelectorAll(`[dropdown-button="${this.id}"]`).forEach((btn) => {
            btns.add(btn);
        });

        btns.forEach((btn) => this.addButton(btn));

        this.dropdown.setAttribute("aria-hidden", "true");

        this.mode = dropdownEl.getAttribute("dropdown-mode") || "popper";

        if (window.DropdownInstances.length === 0) {
            document.addEventListener("keyup", this.onKeyUp);
            window.addEventListener("resize", this.onResize);
        }

        window.DropdownInstances.push(this);
    }

    existingButtons = [];
    addButton(btn) {
        if (this.existingButtons.includes(btn)) return;
        this.existingButtons.push(btn);

        if (!btn.hasAttribute("dropdown-button")) {
            btn.setAttribute("dropdown-button", this.id);
        }

        if (!this.buttons.has(btn)) {
            this.buttons.add(btn);
            btn.addEventListener("click", (e) => this.toggle(e));
        }
    }

    hasRelativePositionedAncestor() {
        let el = this.dropdown.parentElement;
        while (el && el !== document.body) {
            const style = window.getComputedStyle(el);
            if (style.position === "relative") return true;
            el = el.parentElement;
        }
        return false;
    }

    position() {
        if (!this.dropdown || this.buttons.size === 0) return;

        if (this.mode === "popper") {
            const btn = this.buttons.values().next().value;

            if (this.popperInstance) {
                this.popperInstance.destroy();
                this.popperInstance = null;
            }

            let placement = this.dropdown.getAttribute("dropdown-pos") || "bottom-start";

            if (placement.includes(" ")) {
                const [vertical, horizontal] = placement.split(" ");
                placement = `${vertical}-${horizontal === "right" ? "end" : "start"}`;
            }

            this.popperInstance = createPopper(btn, this.dropdown, {
                placement,
                modifiers: [
                    {name: 'offset', options: {offset: [0, 4]}},
                    {name: 'preventOverflow', options: {padding: 8, boundary: 'viewport'}},
                ]
            });
        } else if (this.mode === "legacy") {
            // legacy positioning
            const pos = this.dropdown.getAttribute("dropdown-pos");
            if (!pos) return;

            const [vertical, horizontal] = pos.split(" ");
            const btn = this.buttons.values().next().value;
            const btnRect = btn.getBoundingClientRect();
            const ddRect = this.dropdown.getBoundingClientRect();
            const ancestorRect = this.dropdown.offsetParent
                ? this.dropdown.offsetParent.getBoundingClientRect()
                : document.body.getBoundingClientRect();

            let top, left;

            if (vertical === "top") {
                top = btnRect.top - ddRect.height - ancestorRect.top;
            } else {
                top = btnRect.bottom - ancestorRect.top;
            }

            if (horizontal === "right") {
                left = btnRect.right - ddRect.width - ancestorRect.left;
            } else {
                left = btnRect.left - ancestorRect.left;
            }

            this.dropdown.style.position = "absolute";
            this.dropdown.style.top = `${top}px`;
            this.dropdown.style.left = `${left}px`;
            this.dropdown.style.bottom = "";
        }
    }

    open() {
        if (this.isOpen) return;

        window.DropdownInstances.forEach((inst) => {
            if (inst !== this) inst.close();
        });

        this.isOpen = true;

        const shouldMove =
            this.dropdown.hasAttribute("dropdown-abs") ||
            (window.innerWidth < 600 && this.hasRelativePositionedAncestor());

        if (shouldMove) {
            if (this.dropdown.parentNode !== document.body) {
                this.originalParent = this.dropdown.parentNode;
                this.originalNextSibling = this.dropdown.nextSibling;
                document.body.appendChild(this.dropdown);
            }
        }

        const needsLayer =
            this.dropdown.closest(".navbar") !== null ||
            this.dropdown.hasAttribute("open-layer") ||
            window.innerWidth < 600;

        if (needsLayer) {
            globalClickoffLayer.classList.remove("jsdropdown-clickoff-layer-closed");
        } else {
            this.bodyClickHandler = (e) => {
                if (
                    !e.target.closest("[dropdown]") &&
                    !e.target.closest("[dropdown-button]")
                ) {
                    this.close();
                    document.body.removeEventListener("click", this.bodyClickHandler);
                    this.bodyClickHandler = null;
                }
            };
            document.body.addEventListener("click", this.bodyClickHandler);
        }

        this.dropdown.classList.add("jsdropdown-open");
        this.dropdown.setAttribute("aria-hidden", "false");
        this.buttons.forEach((btn) => btn.classList.add("jsdropdown-button-active"));

        const input = this.dropdown.querySelector("input");
        if (input) setTimeout(() => input.focus(), 40);

        this.dropdown.dispatchEvent(new Event("open"));

        this.position();
    }

    close() {
        if (!this.isOpen) return;

        this.isOpen = false;

        globalClickoffLayer.classList.add("jsdropdown-clickoff-layer-closed");

        this.dropdown.classList.remove("jsdropdown-open");
        this.dropdown.setAttribute("aria-hidden", "true");
        this.buttons.forEach((btn) =>
            btn.classList.remove("jsdropdown-button-active")
        );

        if (this.bodyClickHandler) {
            document.body.removeEventListener("click", this.bodyClickHandler);
            this.bodyClickHandler = null;
        }

        if (this.originalParent) {
            if (this.originalNextSibling) {
                this.originalParent.insertBefore(this.dropdown, this.originalNextSibling);
            } else {
                this.originalParent.appendChild(this.dropdown);
            }
            this.originalParent = null;
            this.originalNextSibling = null;
        }

        if (this.popperInstance) {
            this.popperInstance.destroy();
            this.popperInstance = null;
        }
    }

    toggle(e) {
        if (e) e.stopPropagation();
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    onKeyUp(e) {
        if (e.key === "Escape") {
            window.DropdownInstances.forEach((inst) => inst.close());
        }
    }

    onResize() {
        window.DropdownInstances.forEach((inst) => {
            if (inst.isOpen) inst.position();
        });
    }
}

export function InitDropdowns() {
    document.querySelectorAll("[dropdown]").forEach((dropdownEl) => {
        if (!dropdownEl.hasAttribute("jsdr-init")) {
            dropdownEl.setAttribute("jsdr-init", "");
            new Dropdown(dropdownEl);
        }
    });
}
