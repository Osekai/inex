import "../../css/ui/aos.css"

for (let el of document.querySelectorAll('[data-aos]')) {
    if (el.getAttribute("aos-only-on")) {
        let path = el.getAttribute("aos-only-on");
        if (window.location.pathname.includes(path)) {
            el.removeAttribute("data-aos");
            el.removeAttribute("data-aos-type");
            break;
        }
    }
    el.classList.add('aos-ready');
    if (el.getAttribute("data-aos-always")) {
        el.classList.add('aos-visible');
    }
}

function hasPause(el) {
    let parent = el.parentElement;
    while (parent) {
        if (parent.hasAttribute('aos-pause')) return parent;
        parent = parent.parentElement;
    }
    return null;
}

// Elements that were intersecting but blocked by a pause
const paused = new Map(); // el -> true

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const blocker = hasPause(entry.target);
            if (blocker) {
                paused.set(entry.target, true);
            } else {
                entry.target.classList.add('aos-visible');
                observer.unobserve(entry.target);
            }
        }
    });
}, {
    threshold: 0,
    rootMargin: '0px 0px -30px 0px',
});

document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

// Watch for aos-pause being removed from any element
const pauseObserver = new MutationObserver(() => {
    for (const [el] of paused) {
        if (!hasPause(el)) {
            el.classList.add('aos-visible');
            observer.unobserve(el);
            paused.delete(el);
        }
    }
});

pauseObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['aos-pause'],
    subtree: true,
});
