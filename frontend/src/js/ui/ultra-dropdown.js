export function createDropdown(button, dropdown, position = "bottomright") {
    var special_id = "ed" + Math.round(Math.random() * 99999999); // :/
    dropdown.classList.add(special_id);
    button.classList.add(special_id);

    var opened = false;

    var toggleOpen = () => {
        console.log(opened);
        if (opened === false) {
            opened = true;
            dropdown.classList.add("dropdown-open");
            positionDropdown();
        } else {
            opened = false;
            dropdown.classList.remove("dropdown-open");
        }
    }


    var positionDropdown = () => {
        const buttonRect = button.getBoundingClientRect(); // Button relative to the viewport
        const containerRect = dropdown.offsetParent.getBoundingClientRect(); // Nearest positioned ancestor

        // Calculate the offset relative to the container
        const topOffset = buttonRect.top - containerRect.top;
        const leftOffset = buttonRect.left - containerRect.left;
        const rightOffset = containerRect.right - buttonRect.right;
        const bottomOffset = containerRect.bottom - buttonRect.bottom;

        // Reset any previously set styles
        dropdown.style.top = '';
        dropdown.style.left = '';
        dropdown.style.right = '';
        dropdown.style.bottom = '';

        // Set position based on the specified alignment
        if (position === "bottomright") {
            dropdown.style.top = `${topOffset + button.offsetHeight}px`;
            dropdown.style.right = `${rightOffset}px`;
        } else if (position === "bottomleft") {
            dropdown.style.top = `${topOffset + button.offsetHeight}px`;
            dropdown.style.left = `${leftOffset}px`;
        } else if (position === "topright") {
            dropdown.style.bottom = `${bottomOffset + button.offsetHeight}px`;
            dropdown.style.right = `${rightOffset}px`;
        } else if (position === "topleft") {
            dropdown.style.bottom = `${bottomOffset + button.offsetHeight}px`;
            dropdown.style.left = `${leftOffset}px`;
        }
    }


    document.addEventListener("click", (e) => {
        if (e.target === button || e.target === dropdown || e.target.closest("." + special_id) !== null) {

        } else {
            if (opened) toggleOpen();
        }
    })

    button.addEventListener("click", () => {
        toggleOpen()
    })
    dropdown.addEventListener("click", (e) => {
        // Prevent closing when clicking inside the dropdown
        e.stopPropagation();
    });
}