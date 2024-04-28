var dropdowns = [];
for(let dropdown of document.querySelectorAll("[dropdown]")) {
    let open = false;
    let buttons = [];
    let clickoffLayer = null;



    function SetDropdown(_open = true) {
        var openEvent = new Event("open");

        open = _open;
        if(open) {
            for(let dropdown of dropdowns) dropdown.SetDropdown(false);
            open = _open;
            clickoffLayer = document.createElement("div");
            clickoffLayer.className = "jsdropdown-clickoff-layer";
            document.body.appendChild(clickoffLayer);
            dropdown.classList.add("jsdropdown-open")
            dropdown.setAttribute("aria-hidden", "false");
            dropdown.dispatchEvent(openEvent);
            for(let button of buttons) button.classList.add("jsdropdown-button-active");
            clickoffLayer.addEventListener("click", () => {
                SetDropdown(false);
            })
        }else{
            if(clickoffLayer) clickoffLayer.remove();
            dropdown.classList.remove("jsdropdown-open")
            dropdown.setAttribute("aria-hidden", "true");
            for(let button of buttons) button.classList.remove("jsdropdown-button-active");
        }

    }
    for(let button of document.querySelectorAll("[dropdown-button=\""+dropdown.getAttribute("dropdown")+"\"]")) {
        buttons.push(button);
        button.addEventListener("click", () => {
            SetDropdown(!open);
        })
    }
    dropdowns.push({
        "SetDropdown": SetDropdown
    })

    dropdown.setAttribute("aria-hidden", "true");
}

document.addEventListener("keyup", (e) => {
    if (e.key === "Escape") {
        for(let dropdown of dropdowns) dropdown.SetDropdown(false);
    }
})