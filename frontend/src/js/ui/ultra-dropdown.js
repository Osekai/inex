import { computePosition, offset, flip, shift, autoUpdate } from "@floating-ui/dom";

// maps this project's position names to floating-ui placements
const PLACEMENT_MAP = {
    bottomright: "bottom-end",
    bottomleft: "bottom-start",
    topright: "top-end",
    topleft: "top-start",
};

export function createDropdown(button, dropdown, position = "bottomright") {
    let opened = false;
    let stopAutoUpdate = null;

    dropdown.style.position = "fixed";
    dropdown.style.top = "0";
    dropdown.style.left = "0";

    const placement = PLACEMENT_MAP[position] || "bottom-end";

    const positionDropdown = () => {
        computePosition(button, dropdown, {
            placement,
            strategy: "fixed",
            middleware: [offset(4), flip(), shift({ padding: 8 })],
        }).then(({ x, y }) => {
            dropdown.style.transform = `translate(${x}px, ${y}px)`;
        });
    };

    const close = () => {
        if (!opened) return;
        opened = false;
        dropdown.classList.remove("dropdown-open");
        dropdown.removeAttribute("data-dropdown-open");
        document.removeEventListener("click", handleOutsideClick);
        document.removeEventListener("keydown", handleEscape);
        if (stopAutoUpdate) {
            stopAutoUpdate();
            stopAutoUpdate = null;
        }
    };

    const open = () => {
        if (opened) return;

        document.querySelectorAll("[data-dropdown-open]").forEach((el) => {
            if (el !== dropdown) {
                el.dispatchEvent(new CustomEvent("dropdown:force-close"));
            }
        });
        opened = true;
        dropdown.classList.add("dropdown-open");
        dropdown.setAttribute("data-dropdown-open", "");

        stopAutoUpdate = autoUpdate(button, dropdown, positionDropdown);
        setTimeout(() => {
            document.addEventListener("click", handleOutsideClick);
            document.addEventListener("keydown", handleEscape);
        }, 0);
    };

    const toggleOpen = () => (opened ? close() : open());

    const handleOutsideClick = (e) => {
        if (!dropdown.contains(e.target) && !button.contains(e.target)) {
            close();
        }
    };

    const handleEscape = (e) => {
        if (e.key === "Escape") close();
    };

    button.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleOpen();
    });

    dropdown.addEventListener("click", (e) => e.stopPropagation());

    dropdown.addEventListener("dropdown:force-close", close);

    return () => close();
}