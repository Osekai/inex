import {D2} from "../utils/d2";
let done = false;
export function renderDebugTimings() {
    document.getElementById("debug-timings").classList.toggle("full-hidden");
    if(document.getElementById("debug-timings").classList.contains("full-hidden")) return;
    if(done) return;
    done = true;

    const data = window.be.debugTimings;
    const timingBars = document.getElementById("debug-timing-bars");
    const totalTime = data.finish - data.start;

    const infoOuter = document.getElementById("debug-timing-info");
    const infoTitle = document.getElementById("debug-timing-title");
    const infoDescription = document.getElementById("debug-timing-description");
    const infoTrace = document.getElementById("debug-timing-trace");

    timingBars.innerHTML = "";
    const barOuters = [];

    function createBar(timing, barOuter) {
        const startPercent = ((timing.start - data.start) / totalTime) * 100;
        const endPercent = ((timing.finish - data.start) / totalTime) * 100;


        function formatDuration(ms) {
            if (ms >= 1000) return (ms / 1000).toFixed(2) + "s";
            return ms.toFixed(2) + "ms";
        }

        const duration = (timing.finish - timing.start) * 1000; // convert to ms

        const bar = D2.Div("bar", () => {
            D2.Text("p", timing.name);
            D2.Text("span", formatDuration(duration));
        });


        bar.style.width = (endPercent - startPercent) + "%";
        bar.style.marginLeft = startPercent + "%";
        bar.style.setProperty("--randhue", timing.colour);
        bar.dataset.left = startPercent;
        bar.dataset.right = endPercent+10;

        bar.addEventListener("click", () => {
            const isActive = bar.classList.contains("active");

            document.querySelectorAll(".bar, .bar-outer").forEach(el => el.classList.remove("active"));
            infoOuter.classList.remove("active");

            if (!isActive) {
                bar.classList.add("active");
                barOuter.classList.add("active");
                infoOuter.classList.add("active");

                infoTitle.textContent = timing.name;
                infoDescription.innerHTML = timing.description || "";
                infoTrace.innerText = timing.trace;
            }
        });

        barOuter.appendChild(bar);
        return bar;
    }

    for (let timing of data.timings) {
        const startPercent = ((timing.start - data.start) / totalTime) * 100;
        const endPercent = ((timing.finish - data.start) / totalTime) * 100;

        let placed = false;

        for (let outer of barOuters) {
            const overlap = outer.bars.some(b => {
                const bStart = parseFloat(b.dataset.left);
                const bEnd = parseFloat(b.dataset.right);
                return !(endPercent <= bStart || startPercent >= bEnd);
            });

            if (!overlap) {
                outer.bars.push(createBar(timing, outer.dom));
                placed = true;
                break;
            }
        }

        if (!placed) {
            const barOuter = D2.Div("bar-outer", () => {});
            timingBars.appendChild(barOuter);
            const bar = createBar(timing, barOuter);
            barOuters.push({ bars: [bar], dom: barOuter });
        }
    }
}

