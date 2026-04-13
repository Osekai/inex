import "../../css/views/home.css";
import * as UnicornStudio from '../external/unicornStudio.umd.js'
import lottie from "lottie-web";

var conf = {
    elementId: "unicorn",
    fps: 40,
    scale: 0.6,
    dpi: 1.5,
    filePath: "/public/inex.json",
    fixed: true
};
if (window.innerWidth < 600) {
    conf.scale = 0.5;
}
UnicornStudio.addScene(conf)
    .then((scene) => {
        document.body.classList.add("loaded");
    })
    .catch((err) => {
        console.error(err);
        document.body.classList.add("loaded");
    });


const anim = lottie.loadAnimation({
    container: document.getElementById("logo-anim"),
    renderer: "svg",
    autoplay: false,
    loop: false,
    path: "/public/osekai-lottie.json",
});
anim.addEventListener("config_ready", () => {
    anim.setSpeed(0.8);
    anim.play();
    document.getElementById("home-welcome").classList.add("lottie-running");
    setTimeout(() => {
        document.getElementById("home-welcome").classList.add("lottie-done");
    }, 700)
    setTimeout(() => {
        document.getElementById("home-welcome").classList.add("lottie-doner");
    }, 2100)
})
