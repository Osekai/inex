let mouseX = 0;
let mouseY = 0;

document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

export function getMousePosition() {
    return { x: mouseX, y: mouseY };
}
