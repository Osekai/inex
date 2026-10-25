import {D2} from "../utils/d2";
import "../../css/ui/graph.css";

export class Graph {
    container = null;
    inner = null;
    outer = null;
    tooltip = null;
    xAxisWrap = null;
    xAxisInner = null;
    yAxisEl = null;
    crosshairEl = null;
    crosshairLine = null;
    crosshairDot = null;

    data = [];
    minTs = 0;
    maxTs = 0;
    minVal = 0;
    maxVal = 0;

    zoom = 1;
    panX = 0;
    baseWidth = 0;

    PAD_T = 20;
    PAD_B = 28;
    PAD_L = 44;
    PAD_R = 16;
    H = 300;

    getValue = d => d.value;
    renderTooltip = d => `${d.value}`;
    defaultColour = "#ffffff";
    events = [];

    constructor(container) {
        this.container = container;
    }

    load(rawData) {
        this.data = rawData
            .map(d => ({ raw: d, ts: new Date(d.date).getTime(), value: this.getValue(d) }))
            .sort((a, b) => a.ts - b.ts);

        if (this.data.length === 0) return this;

        this.minTs = this.data[0].ts;
        this.maxTs = this.data[this.data.length - 1].ts;
        this.minVal = Math.min(...this.data.map(d => d.value));
        this.maxVal = Math.max(...this.data.map(d => d.value));

        this._buildDom();
        this._bindEvents();
        this.render();
        return this;
    }

    // sorted once per render, there can be one colour event per data point
    _buildColourEvents() {
        this._colourEvents = this.events
            .filter(e => e.type === "colour")
            .map(e => ({ ts: new Date(e.date).getTime(), colour: e.colour }))
            .sort((a, b) => a.ts - b.ts);
    }

    // last colour event at or before ts, binary search
    _colourAt(ts) {
        let low = 0;
        let high = this._colourEvents.length - 1;
        let found = -1;
        while (low <= high) {
            let mid = (low + high) >> 1;
            if (this._colourEvents[mid].ts <= ts) {
                found = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        if (found === -1) return this.defaultColour;
        return this._colourEvents[found].colour;
    }

    _buildDom() {
        this.outer = D2.Div("graph-outer");
        this.container.appendChild(this.outer);

        this.inner = D2.Div("graph-inner");
        this.outer.appendChild(this.inner);

        // sticky overlay — never pans, always visible on the left
        this.yAxisEl = D2.Div("graph-y-axis");
        this.outer.appendChild(this.yAxisEl);

        // crosshair overlay — fixed, pointer-events none
        this.crosshairEl = D2.Div("graph-crosshair");
        this.crosshairLine = D2.Div("graph-crosshair-line");
        this.crosshairDot = D2.Div("graph-crosshair-dot");
        this.crosshairEl.appendChild(this.crosshairLine);
        this.crosshairEl.appendChild(this.crosshairDot);
        this.outer.appendChild(this.crosshairEl);

        this.tooltip = D2.Div("graph-tooltip");
        this.outer.appendChild(this.tooltip);

        this.xAxisWrap = D2.Div("graph-x-axis");
        this.outer.appendChild(this.xAxisWrap);

        this.xAxisInner = D2.Div("graph-x-axis-inner");
        this.xAxisWrap.appendChild(this.xAxisInner);
    }

    _xOf(ts, totalW) {
        const plotW = totalW - this.PAD_L - this.PAD_R;
        return this.PAD_L + ((ts - this.minTs) / (this.maxTs - this.minTs)) * plotW;
    }

    _yOf(value, plotH) {
        return this.PAD_T + (1 - (value - this.minVal) / (this.maxVal - this.minVal)) * plotH;
    }

    _doZoom(factor, centerX) {
        const outerW = this.outer.clientWidth;
        const cx = centerX ?? outerW / 2;

        // preserve the data fraction under cx across zoom
        const totalW = Math.round(this.baseWidth * this.zoom);
        const plotW = totalW - this.PAD_L - this.PAD_R;
        const frac = (cx - this.panX - this.PAD_L) / plotW;

        this.zoom = Math.max(1, Math.min(20, this.zoom * factor));

        const newTotalW = Math.round(this.baseWidth * this.zoom);
        const newPlotW = newTotalW - this.PAD_L - this.PAD_R;
        // solve: cx = PAD_L + frac * newPlotW + panX
        this.panX = cx - this.PAD_L - frac * newPlotW;
        this.panX = Math.min(0, Math.max(outerW - newTotalW, this.panX));

        this.render();
        this._applyPan();
        if (this._lastMouseX != null) {
            const mx = this._lastMouseX - this.panX;
            const ts = this.minTs + ((mx - this.PAD_L) / (newTotalW - this.PAD_L - this.PAD_R)) * (this.maxTs - this.minTs);
            let nearest = this.data[0];
            let nearestDist = Infinity;
            for (const p of this.data) {
                const dist = Math.abs(p.ts - ts);
                if (dist < nearestDist) { nearestDist = dist; nearest = p; }
            }
            this._lastMouseX = this._xOf(nearest.ts, newTotalW) + this.panX;
        }
        this._updateHover();
    }

    _updateHover() {
        if (this._lastMouseX == null) return;
        const mx = this._lastMouseX - this.panX;
        const totalW = Math.round(this.baseWidth * this.zoom);
        const ts = this.minTs + ((mx - this.PAD_L) / (totalW - this.PAD_L - this.PAD_R)) * (this.maxTs - this.minTs);

        let nearest = this.data[0];
        let nearestDist = Infinity;
        for (const p of this.data) {
            const dist = Math.abs(p.ts - ts);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = p;
            }
        }

        const plotH = this.H - this.PAD_T - this.PAD_B;
        const snappedX = this._xOf(nearest.ts, totalW) + this.panX;
        const snappedY = this._yOf(nearest.value, plotH);

        this.crosshairEl.classList.add("visible");
        this.crosshairLine.style.left = snappedX + "px";
        this.crosshairDot.style.left = snappedX + "px";
        this.crosshairDot.style.top = snappedY + "px";

        if (this._lastNearest !== nearest) {
            this._lastNearest = nearest;
            this.tooltip.innerHTML = this.renderTooltip(nearest.raw);
        }
        this.tooltip.classList.add("visible");

        // show event labels when hovering within threshold of their marker
        const LABEL_THRESHOLD_PX = 20;
        const markers = this.inner.querySelectorAll(".graph-event-marker");

        // only the closest marker lights up, otherwise clustered events all show at once
        let closest = null;
        let closestDist = LABEL_THRESHOLD_PX;
        for (const marker of markers) {
            const markerX = parseFloat(marker.style.left) + this.panX;
            const dist = Math.abs(this._lastMouseX - markerX);
            if (dist < closestDist) {
                closestDist = dist;
                closest = marker;
            }
        }

        for (const marker of markers) {
            const active = marker === closest;
            marker.classList.toggle("label-visible", active);

            const line = marker.querySelector(".graph-event-line");
            if (line) line.classList.toggle("hovered", active);
        }
    }

    _applyPan() {
        const outerW = this.outer.clientWidth;
        const totalW = Math.round(this.baseWidth * this.zoom);
        this.panX = Math.min(0, Math.max(outerW - totalW, this.panX));
        this.inner.style.transform = `translateX(${this.panX}px)`;
        this.xAxisInner.style.transform = `translateX(${this.panX}px)`;
        // y axis never moves — no transform applied
    }

    _bindEvents() {
        this.outer.addEventListener("wheel", e => {
            e.preventDefault();
            const rect = this.outer.getBoundingClientRect();
            this._doZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - rect.left);
        }, { passive: false });

        let dragStartX = null;
        let dragStartPan = null;
        this.outer.addEventListener("mousedown", e => {
            dragStartX = e.clientX;
            dragStartPan = this.panX;
            this.outer.classList.add("dragging");
        });
        window.addEventListener("mousemove", e => {
            if (dragStartX === null) return;
            this.panX = dragStartPan + (e.clientX - dragStartX);
            this._applyPan();
        });
        window.addEventListener("mouseup", () => {
            dragStartX = null;
            this.outer.classList.remove("dragging");
        });

        let touchStartX = null;
        let touchStartPan = null;
        let pinchStart = null;
        let pinchZoomStart = null;
        this.outer.addEventListener("touchstart", e => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartPan = this.panX;
            } else if (e.touches.length === 2) {
                pinchStart = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
                pinchZoomStart = this.zoom;
            }
        }, { passive: true });
        this.outer.addEventListener("touchmove", e => {
            if (e.touches.length === 1 && touchStartX !== null) {
                this.panX = touchStartPan + (e.touches[0].clientX - touchStartX);
                this._applyPan();
            } else if (e.touches.length === 2 && pinchStart !== null) {
                const dist = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
                this.zoom = Math.max(1, Math.min(20, pinchZoomStart * (dist / pinchStart)));
                this.render();
                this._applyPan();
            }
        }, { passive: true });
        this.outer.addEventListener("touchend", () => {
            touchStartX = null;
            pinchStart = null;
        });

        this.outer.addEventListener("mousemove", e => {
            const rect = this.outer.getBoundingClientRect();
            this._lastMouseX = e.clientX - rect.left;
            this._updateHover();
        });
        this.outer.addEventListener("mouseleave", () => {
            this._lastMouseX = null;
            this.crosshairEl.classList.remove("visible");
            this.tooltip.classList.remove("visible");
            for (const marker of this.inner.querySelectorAll(".graph-event-marker")) {
                marker.classList.remove("label-visible");
            }
        });

        window.addEventListener("resize", () => {
            this.zoom = 1;
            this.panX = 0;
            this.baseWidth = 0;
            this.render();
        });
    }

    _renderYAxis(plotH) {
        this.yAxisEl.innerHTML = "";

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", this.PAD_L);
        svg.setAttribute("height", this.H);
        this.yAxisEl.appendChild(svg);

        for (let g = 0; g <= 5; g++) {
            const v = this.minVal + (g / 5) * (this.maxVal - this.minVal);
            const y = this._yOf(v, plotH);

            const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
            lbl.setAttribute("x", this.PAD_L - 5);
            lbl.setAttribute("y", y + 4);
            lbl.setAttribute("text-anchor", "end");
            lbl.setAttribute("class", "graph-y-label");
            lbl.textContent = Math.round(v);
            svg.appendChild(lbl);
        }
    }

    render() {
        this.inner.innerHTML = "";
        this.xAxisInner.innerHTML = "";

        this.baseWidth = this.outer.clientWidth || this.baseWidth || 640;
        const totalW = Math.round(this.baseWidth * this.zoom);
        const plotH = this.H - this.PAD_T - this.PAD_B;

        const xOf = ts => this._xOf(ts, totalW);
        const yOf = v => this._yOf(v, plotH);

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", totalW);
        svg.setAttribute("height", this.H);
        this.inner.appendChild(svg);

        // horizontal grid lines only — labels are in the sticky overlay
        for (let g = 0; g <= 5; g++) {
            const v = this.minVal + (g / 5) * (this.maxVal - this.minVal);
            const y = yOf(v);

            const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            gridLine.setAttribute("x1", this.PAD_L);
            gridLine.setAttribute("x2", totalW - this.PAD_R);
            gridLine.setAttribute("y1", y);
            gridLine.setAttribute("y2", y);
            gridLine.setAttribute("class", "graph-grid-line");
            svg.appendChild(gridLine);
        }

        this._buildColourEvents();
        const colours = this.data.map(d => this._colourAt(d.ts));

        const segments = [];
        let segStart = 0;
        for (let i = 1; i < this.data.length; i++) {
            if (colours[i] !== colours[i - 1]) {
                segments.push({ from: segStart, to: i, colour: colours[i - 1] });
                segStart = i;
            }
        }
        segments.push({ from: segStart, to: this.data.length - 1, colour: colours[segStart] });

        for (const seg of segments) {
            const pts = [];
            for (let i = seg.from; i <= seg.to; i++) {
                // same value as the one before draws the same flat line
                if (i > seg.from && i < seg.to && this.data[i].value === this.data[i - 1].value) continue;
                if (i > seg.from) {
                    pts.push(`${xOf(this.data[i].ts)},${yOf(this.data[i - 1].value)}`);
                }
                pts.push(`${xOf(this.data[i].ts)},${yOf(this.data[i].value)}`);
            }
            const pl = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            pl.setAttribute("points", pts.join(" "));
            pl.setAttribute("fill", "none");
            pl.setAttribute("stroke", seg.colour);
            pl.setAttribute("class", "graph-line");
            svg.appendChild(pl);
        }

        for (const ev of this.events) {
            if (ev.type !== "event") continue;
            const ts = new Date(ev.date).getTime();
            if (ts < this.minTs || ts > this.maxTs) continue;

            const marker = D2.Div("graph-event-marker");
            marker.style.left = xOf(ts) + "px";
            marker.dataset.ts = ts;
            marker.appendChild(D2.Div("graph-event-line"));
            marker.appendChild(D2.Div("graph-event-dot"));
            const label = D2.Text("span", ev.title, "graph-event-label");
            marker.appendChild(label);
            this.inner.appendChild(marker);
        }

        // x axis labels
        this.xAxisInner.style.width = totalW + "px";

        const msPerPixel = (this.maxTs - this.minTs) / (totalW - this.PAD_L - this.PAD_R);
        const minLabelSpacingMs = msPerPixel * 70;

        const totalMs = this.maxTs - this.minTs;
        const maxLabels = Math.max(2, Math.floor(totalMs / minLabelSpacingMs));
        const labelCount = Math.min(maxLabels, Math.floor(8 * this.zoom));

        for (let i = 0; i < labelCount; i++) {
            const ts = this.minTs + (totalMs / (labelCount - 1)) * i;

            const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            vLine.setAttribute("x1", xOf(ts));
            vLine.setAttribute("x2", xOf(ts));
            vLine.setAttribute("y1", this.PAD_T);
            vLine.setAttribute("y2", this.H - this.PAD_B);
            vLine.setAttribute("class", "graph-grid-line graph-grid-line--vertical");
            svg.appendChild(vLine);

            const lbl = D2.Text("span", D2.TimeFull(new Date(ts), {style: "short"}), "graph-x-label");
            lbl.style.left = xOf(ts) + "px";
            this.xAxisInner.appendChild(lbl);
        }

        // render sticky y axis labels
        this._renderYAxis(plotH);
    }

    remove() {
        this.outer.remove();
        this.xAxisWrap.remove();
    }

    zoomIn() { this._doZoom(1.5); }
    zoomOut() { this._doZoom(1 / 1.5); }
    reset() { this.zoom = 1; this.panX = 0; this.render(); this._applyPan(); }
}