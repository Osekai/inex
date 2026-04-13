import tippy from 'tippy.js';
export function SetTooltip(element, text, placement = "top") {
    // Destroy existing tooltips on the element
    if (element._tippy) {
        element._tippy.destroy();
    }

    // Create a new tooltip with the specified text
    tippy(element, {
        content: text,
        placement: placement, // or 'bottom', 'left', 'right'
        arrow: true,
    });
}
