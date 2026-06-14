import { useCallback } from 'react';

/**
 * Print an HTML document through a hidden, throwaway iframe. The iframe
 * gets its own document, so the label sheet's `@page size: A4` cannot
 * collide with the global 80mm receipt print stylesheet (which hides
 * every `body > *` without the receipt marker during `window.print()`).
 * The frame is removed on `afterprint`, with a timeout fallback for
 * browsers that never fire it inside iframes.
 */
export function usePrintLabelSheet() {
    const printLabelSheet = useCallback((html: string) => {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument;
        const win = iframe.contentWindow;
        if (!doc || !win) {
            iframe.remove();
            return;
        }
        doc.open();
        doc.write(html);
        doc.close();

        let removed = false;
        const remove = () => {
            if (removed) return;
            removed = true;
            iframe.remove();
        };
        win.addEventListener('afterprint', () => window.setTimeout(remove, 250), {
            once: true,
        });
        window.setTimeout(remove, 60_000);
        // Defer so the iframe lays out the sheet before capture.
        window.setTimeout(() => {
            win.focus();
            win.print();
        }, 50);
    }, []);

    return { printLabelSheet };
}
