import DOMPurify from 'dompurify';

export function SanitizeHTML(html) {
    DOMPurify.addHook('uponSanitizeElement', (node, data) => {
        if(!(data.tagName in data.allowedTags)) {
            console.log(data.tagName + " removed")
        }
    });

    const sanitizedHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'font', 'b', 'i', 'em', 'strong', 'u', 'span', 'div', 'p', 'code', 'pre',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr', 'del', 'ul', 'li', 'ol', 'blockquote',
            'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'img', 'sup', 'sub', 'dl', 'dt', 'dd', 'kbd'
        ],
        ALLOWED_ATTR: [
            'color', 'href', 'target', 'title', 'src', 'alt', 'width', 'height',
            'border', 'colspan', 'rowspan', 'class', 'style'
        ],

        ALLOWED_URI_REGEXP: /^https?:/,
    });

    DOMPurify.removeAllHooks();

    return sanitizedHtml;
}
