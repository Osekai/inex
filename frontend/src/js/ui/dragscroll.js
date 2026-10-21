// drag to scroll with throw inertia, tuned to feel like osu!stable's scrollable areas
// works on the page and on any vertically scrollable element, for mouse and pen (touch is left native)

const DRAG_THRESHOLD = 5; // px moved before a press becomes a drag
const VELOCITY_CUTOFF = 0.01; // px/ms, below this we stop
const BRAKE_DECELERATION = 0.95; // per ms while a throw is being caught, stops in roughly 100ms
const RELEASE_GRACE = 66; // ms of no movement before release velocity gets penalised

// horizontal scrollers inside the page, a drag that starts on one picks an axis and sticks to it
const AXIS_LOCK_SELECTOR = "[data-axis-lock]";

const IGNORED_SELECTOR = "input, textarea, select, option, [contenteditable], [data-no-drag-scroll], .dropdown-content";

let pointerId = null;
let target = null; // element being scrolled, or window

let startX = 0;
let startY = 0;
let axisLock = false; // gesture started on a horizontal scroller
let blockHorizontal = false; // vertical won, keep the scroller from also moving
let startScroll = 0;
let lastY = 0;
let lastMoveTime = 0;
let lastMovementTime = 0; // last time the pointer actually moved
let accumulatedTime = 0;

let dragging = false;
let velocity = 0; // px/ms, positive scrolls down
let deceleration = 0;

let coastFrame = null;
let lastFrameTime = 0;

function getScroll(el) {
    if (el === window) {
        return window.scrollY;
    }
    return el.scrollTop;
}

function getMaxScroll(el) {
    if (el === window) {
        return document.documentElement.scrollHeight - window.innerHeight;
    }
    return el.scrollHeight - el.clientHeight;
}

function setScroll(el, value) {
    const max = getMaxScroll(el);
    if (value < 0) value = 0;
    if (value > max) value = max;

    if (el === window) {
        window.scrollTo({ top: value, behavior: "instant" });
    } else {
        el.scrollTo({ top: value, behavior: "instant" });
    }
    return value;
}

// nearest ancestor that can actually scroll vertically, otherwise the page
function findScrollTarget(el) {
    while (el && el !== document.body && el !== document.documentElement) {
        const style = getComputedStyle(el);
        const overflowY = style.overflowY;
        if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
            return el;
        }
        el = el.parentElement;
    }
    return window;
}

// pressing on an element's own scrollbar shouldn't start a drag
function isOnScrollbar(el, e) {
    if (el === window) {
        return e.clientX >= document.documentElement.clientWidth;
    }
    const rect = el.getBoundingClientRect();
    return e.clientX >= rect.left + el.clientWidth;
}

function stopCoasting() {
    if (coastFrame !== null) {
        cancelAnimationFrame(coastFrame);
        coastFrame = null;
    }
    velocity = 0;
}

// grabbing a moving page eases it to a stop instead of cutting it dead
function brakeCoasting() {
    if (coastFrame === null) return;
    deceleration = BRAKE_DECELERATION;
}

function onPointerDown(e) {
    if (e.pointerType === "touch") return;
    if (e.button !== 0) return;

    // grabbing while it's still moving catches it
    brakeCoasting();

    if (e.target.closest(IGNORED_SELECTOR)) return;

    const scrollTarget = findScrollTarget(e.target);
    if (getMaxScroll(scrollTarget) <= 0) return;
    if (isOnScrollbar(scrollTarget, e)) return;

    pointerId = e.pointerId;
    target = scrollTarget;
    dragging = false;

    startX = e.clientX;
    startY = e.clientY;
    axisLock = !!e.target.closest(AXIS_LOCK_SELECTOR);
    lastY = e.clientY;
    startScroll = getScroll(scrollTarget);
    lastMoveTime = e.timeStamp;
    lastMovementTime = e.timeStamp;
    accumulatedTime = 0;
}

function onPointerMove(e) {
    if (e.pointerId !== pointerId) return;

    if (!dragging) {
        const movedY = Math.abs(e.clientY - startY);

        if (axisLock) {
            const movedX = Math.abs(e.clientX - startX);
            if (movedX >= DRAG_THRESHOLD && movedX > movedY) {
                // horizontal, the scroller owns this gesture so the page stays put
                pointerId = null;
                return;
            }
        }

        if (movedY < DRAG_THRESHOLD) return;

        dragging = true;
        blockHorizontal = axisLock;

        // the drag takes over from wherever the braking got to
        stopCoasting();
        startScroll = getScroll(target);
        document.documentElement.classList.add("drag-scrolling");
        window.getSelection()?.removeAllRanges();

        // start from here so the threshold doesn't cause a jump
        startY = e.clientY;
        lastY = e.clientY;
    }

    // speed is smoothed over time since input events and frames don't line up
    const elapsed = e.timeStamp - lastMoveTime;
    lastMoveTime = e.timeStamp;

    if (elapsed > 0) {
        accumulatedTime += elapsed;
        const moveVelocity = (lastY - e.clientY) / accumulatedTime;

        // adapt fast to speeding up or changing direction, slowly to slowing down
        // (people naturally slow down a bit right before letting go)
        let highDecay = false;
        if (Math.sign(moveVelocity) === -Math.sign(velocity)) highDecay = true;
        if (Math.abs(moveVelocity) > Math.abs(velocity)) highDecay = true;

        if (moveVelocity !== 0) {
            let base = 0.95;
            if (highDecay) base = 0.90;
            const decay = Math.pow(base, accumulatedTime);

            velocity = velocity * decay + (1 - decay) * moveVelocity;
            accumulatedTime = 0;
            lastMovementTime = e.timeStamp;
        }
    }

    lastY = e.clientY;
    setScroll(target, startScroll + (startY - e.clientY));
    e.preventDefault();
}

function eatClick(e) {
    e.stopPropagation();
    e.preventDefault();
}

function onPointerUp(e) {
    blockHorizontal = false;
    if (e.pointerId !== pointerId) return;

    const wasDragging = dragging;
    pointerId = null;
    dragging = false;
    document.documentElement.classList.remove("drag-scrolling");

    if (!wasDragging) return;

    // eat the click that follows a drag so we don't open whatever was under the cursor
    window.addEventListener("click", eatClick, { capture: true, once: true });
    // if no click comes (released somewhere else) don't eat the next real one
    setTimeout(() => window.removeEventListener("click", eatClick, { capture: true }), 0);

    if (e.type === "pointercancel") {
        velocity = 0;
        return;
    }

    // holding still before letting go kills the throw
    const stillTime = e.timeStamp - lastMovementTime;
    velocity *= Math.pow(0.95, Math.max(0, stillTime - RELEASE_GRACE));

    // slow throws decay quicker than fast ones
    if (velocity === 0) return;
    deceleration = Math.max(0.5, 0.996 - 0.002 / Math.abs(velocity));

    lastFrameTime = performance.now();
    coastFrame = requestAnimationFrame(coast);
}

function coast(now) {
    const frameTime = now - lastFrameTime;
    lastFrameTime = now;

    // velocity decays exponentially per ms, distance is the exact area under that curve
    let timeToCutoff = 0;
    if (Math.abs(velocity) > VELOCITY_CUTOFF) {
        timeToCutoff = Math.log(VELOCITY_CUTOFF / Math.abs(velocity)) / Math.log(deceleration);
    }
    const elapsed = Math.min(timeToCutoff, frameTime);

    const newVelocity = velocity * Math.pow(deceleration, elapsed);
    const distance = (newVelocity - velocity) / Math.log(deceleration);
    velocity = newVelocity;

    const wanted = getScroll(target) + distance;
    const actual = setScroll(target, wanted);

    // hit the top or bottom, or ran out of speed
    if (Math.abs(actual - wanted) > 0.5 || Math.abs(velocity) <= VELOCITY_CUTOFF) {
        stopCoasting();
        return;
    }

    coastFrame = requestAnimationFrame(coast);
}

let initialised = false;

export function InitDragScroll() {
    if (initialised) return;
    initialised = true;

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    // embla listens for mouse events, so a vertical drag hides them from it
    window.addEventListener("mousemove", (e) => {
        if (blockHorizontal) e.stopPropagation();
    }, { capture: true });

    // wheel or keyboard takes over from a throw
    window.addEventListener("wheel", stopCoasting, { passive: true });
    window.addEventListener("keydown", stopCoasting);

    // stop the browser's own image/link drag ghost from hijacking the drag
    window.addEventListener("dragstart", (e) => {
        if (e.target.closest && e.target.closest("img, a")) {
            e.preventDefault();
        }
    });
}
