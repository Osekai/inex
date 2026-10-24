// ported from anthera (frontend/src/js/ui/lightbox.js)
import lightGallery from 'lightgallery';
import 'lightgallery/css/lightgallery.css';

const ZOOM_SCALE = 2.5;
const ZOOM_TRANSITION = 'transform 0.2s ease';

// container = original hidden div (lg custom events fire here)
// lgContainer = the actual rendered #lg-container-N element (mouse events go here)
function attachZoom(container, lgContainer, instance) {
    let img = null;
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let dragging = false;
    let dragStartX, dragStartY, panStartX, panStartY;
    let didDrag = false;
    const multiImage = instance.settings.enableSwipe;

    function getImg() {
        return lgContainer.querySelector('.lg-current .lg-image');
    }

    function applyTransform(animated = false) {
        if (!img) return;
        img.style.transition = animated ? ZOOM_TRANSITION : 'none';
        img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
        img.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
    }

    function clamp() {
        if (!img) return;
        const scaledW = img.offsetWidth * scale;
        const scaledH = img.offsetHeight * scale;
        const maxX = Math.max(0, (scaledW - window.innerWidth) / 2);
        const maxY = Math.max(0, (scaledH - window.innerHeight) / 2);
        panX = Math.max(-maxX, Math.min(maxX, panX));
        panY = Math.max(-maxY, Math.min(maxY, panY));
    }

    function setSwipe(enabled) {
        if (!multiImage) return;
        instance.settings.enableSwipe = enabled;
        instance.settings.enableDrag = enabled;
    }

    function reset(animated = true) {
        scale = 1;
        panX = 0;
        panY = 0;
        applyTransform(animated);
        setSwipe(true);
    }

    // lg custom events fire on the original container
    container.addEventListener('lgSlideItemLoad', () => {
        img = getImg();
        if (!img) return;
        img.style.transformOrigin = 'center center';
        img.style.willChange = 'transform';
        applyTransform(false);
    });

    container.addEventListener('lgBeforeSlide', () => {
        scale = 1; panX = 0; panY = 0; img = null;
        setSwipe(true);
    });

    // capture phase so our handlers run before lightGallery's bubbling handlers
    lgContainer.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.lg-image')) return;
        e.preventDefault();
        if (scale > 1) e.stopPropagation();
        dragging = false;
        didDrag = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        panStartX = panX;
        panStartY = panY;
        console.log('[lightbox] mousedown', { x: e.clientX, y: e.clientY, scale, target: e.target });
    }, true);

    lgContainer.addEventListener('mouseup', (e) => {
        const dx = Math.abs(e.clientX - dragStartX);
        const dy = Math.abs(e.clientY - dragStartY);
        console.log('[lightbox] mouseup', {
            x: e.clientX, y: e.clientY,
            dragStartX, dragStartY,
            dx, dy,
            dragging, didDrag, scale,
            target: e.target,
            onImage: !!e.target.closest('.lg-image'),
        });

        if (dragging) {
            dragging = false;
            if (img) img.style.cursor = 'grab';
            if (scale > 1) e.stopPropagation();
            console.log('[lightbox] mouseup: was dragging, aborting');
            return;
        }

        if (!img || !e.target.closest('.lg-image')) {
            console.log('[lightbox] mouseup: no img or not on image, aborting');
            return;
        }

        if (dx > 5 || dy > 5) {
            console.log('[lightbox] mouseup: moved too far, treating as swipe, aborting zoom');
            return;
        }

        if (scale > 1) {
            console.log('[lightbox] mouseup: already zoomed, resetting');
            reset();
            e.stopPropagation();
            return;
        }

        console.log('[lightbox] mouseup: zooming in');
        scale = ZOOM_SCALE;
        panX = (window.innerWidth / 2 - e.clientX) * (scale - 1);
        panY = (window.innerHeight / 2 - e.clientY) * (scale - 1);
        clamp();
        applyTransform(true);
        setSwipe(false);
    }, true);

    // safety net — if the mouse is released anywhere outside the image,
    // make sure we still clean up the drag state
    window.addEventListener('mouseup', () => {
        if (dragging) {
            dragging = false;
            if (img) img.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
        }
    });

    lgContainer.addEventListener('mousemove', (e) => {
        if (!img || !e.buttons || scale <= 1) return;
        if (!e.target.closest('.lg-image') && !dragging) return;
        if (scale > 1) e.stopPropagation();

        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;

        if (!dragging && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
            dragging = true;
            didDrag = true;
            img.style.cursor = 'grabbing';
            img.style.transition = 'none';
        }

        if (dragging) {
            panX = panStartX + dx;
            panY = panStartY + dy;
            clamp();
            applyTransform(false);
        }
    });

    lgContainer.addEventListener('wheel', (e) => {
        if (!img) return;
        e.preventDefault();

        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        const newScale = Math.max(1, Math.min(5, scale + delta));

        if (newScale === 1) { reset(true); return; }

        const rect = img.getBoundingClientRect();
        const imgCenterX = rect.left + rect.width / 2;
        const imgCenterY = rect.top + rect.height / 2;

        // cursor position relative to the image center
        const cursorFromCenterX = e.clientX - imgCenterX;
        const cursorFromCenterY = e.clientY - imgCenterY;

        const ratio = newScale / scale;
        panX = cursorFromCenterX - ratio * (cursorFromCenterX - panX);
        panY = cursorFromCenterY - ratio * (cursorFromCenterY - panY);
        scale = newScale;
        clamp();
        applyTransform(false);
        setSwipe(false);
    }, { passive: false });
}

export default class Lightbox {
    static #defaults = {
        plugins: [],
        licenseKey: "0000-0000-000-0000",
        loop: false,
        keyboardNavigation: true,
        closeOnTap: true,
        hideControlOnEnd: true,
        mode: 'lg-fade'
    };

    /**
     * Open a dynamic gallery programmatically.
     *
     * @param {Array<{src: string, thumb?: string, alt?: string, caption?: string}>} items
     * @param {number} startIndex
     * @param {object} overrides
     * @returns the lightGallery instance
     */
    static open(items, startIndex = 0, overrides = {}) {
        const container = document.createElement("div");
        container.style.display = "none";
        document.body.appendChild(container);

        const instance = lightGallery(container, {
            ...Lightbox.#defaults,
            ...overrides,
            dynamic: true,
            index: startIndex,
            enableSwipe: items.length > 1,
            enableDrag: items.length > 1,
            dynamicEl: items.map((item) => ({
                src: item.src,
                thumb: item.thumb || item.src,
                alt: item.alt || "",
                subHtml: item.caption ? `<p>${item.caption}</p>` : "",
            })),
        });

        container.addEventListener('lgAfterOpen', () => {
            const lgContainer = instance.outer.get();
            attachZoom(container, lgContainer, instance);
        }, { once: true });

        container.addEventListener("lgAfterClose", () => {
            instance.destroy();
            container.remove();
        }, { once: true });

        instance.openGallery(startIndex);
        return instance;
    }

    /**
     * Bind lightGallery to a container element that already has
     * anchor > img children (standard DOM gallery pattern).
     *
     * @param {HTMLElement} el
     * @param {object} overrides
     * @returns the lightGallery instance
     */
    static bind(el, overrides = {}) {
        return lightGallery(el, { ...Lightbox.#defaults, ...overrides });
    }

    /**
     * Auto-bind all img.lightbox elements on the page.
     * Each opens as a single-item dynamic gallery on click.
     * Safe to call multiple times - already-bound images are skipped.
     */
    static init() {
        document.querySelectorAll("img.lightbox").forEach((img) => {
            if (img.dataset.lgBound) return;
            img.dataset.lgBound = "1";
            img.style.cursor = "zoom-in";

            img.addEventListener("click", () => {
                Lightbox.open([{
                    src: img.dataset.lgSrc || img.src,
                    thumb: img.src,
                    alt: img.alt || "",
                }]);
            });
        });
    }
}