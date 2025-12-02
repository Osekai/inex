// https://github.com/anthera-art/web/blob/35bfeff61015bfd640caa23f4d566c060c9de8b8/frontend/src/js/utils/debounce.js
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}