export function makeLinksClickable(container) {
    const textNodes = getTextNodes(container);
    textNodes.forEach((node) => {
        const parent = node.parentNode;
        const parts = node.nodeValue.split(/(https?:\/\/[^\s]+)/g);
        const fragment = document.createDocumentFragment();

        parts.forEach((part) => {
            if (part.match(/https?:\/\/[^\s]+/)) {
                const link = document.createElement('a');
                link.href = part;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = part;
                fragment.appendChild(link);
            } else {
                fragment.appendChild(document.createTextNode(part));
            }
        });
        parent.replaceChild(fragment, node);
    });
}

function getTextNodes(node) {
    const textNodes = [];
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => {
            return n.parentNode.tagName !== 'IMG' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
    });
    let currentNode;
    while (currentNode = walker.nextNode()) {
        textNodes.push(currentNode);
    }
    return textNodes;
}
