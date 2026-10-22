import "../../css/views/retro_achiever.css";

// ported from eclipse: omh/retro_achiever
document.addEventListener("mousemove", (event) => {
    let width = window.visualViewport.width;
    let height = window.visualViewport.height;
    let x = ((event.clientX / width) * 2) - 1;
    let y = ((event.clientY / height) * 2) - 1;

    document.body.style.setProperty("--mousex", (-x * 5) + "deg");
    document.body.style.setProperty("--mousey", (-y * 5) + "deg");
});
