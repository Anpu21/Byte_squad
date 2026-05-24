import { useCallback, useState } from 'react';
import type { ISale } from '@/types';
import { usePosMarkPrinted } from '@/features/pos/hooks/usePosMarkPrinted';

interface IUsePrintReceiptReturn {
    /** Currently-printing sale, or null when idle. Consumers MUST render
     * the print host through `createPortal(..., document.body)` so the
     * host is a direct child of `<body>` — the @media print rules in
     * `pos-bill-template.css` hide every `body > *` and only un-hide
     * `body > [data-pos-print-area]`. Rendering the host inside `#root`
     * (or any other React tree below body) results in a blank printout
     * because `#root` itself gets suppressed. Wrap the portalled element
     * with `data-pos-print-area`; the inner `<PosBillTemplate>` already
     * carries the same attribute but only the body-level marker matters
     * for the print isolation rule. */
    printingSale: ISale | null;
    /** Imperatively start the print flow for a given sale. Resolves after
     * the OS print dialog closes (or after the markPrinted round-trip
     * completes). Errors from markPrinted are swallowed so a flaky network
     * never breaks the print itself — the cashier still got their paper. */
    printReceipt: (sale: ISale) => Promise<void>;
}

/**
 * Owns the imperative print flow for a sale receipt. Toggles `printingSale`
 * so the caller can render `PosBillTemplate` in-DOM, schedules
 * `window.print()` on the next paint, and listens once for `afterprint`.
 * On afterprint we clear state and fire `posService.markPrinted(saleId)`
 * via the existing TanStack mutation hook so recent-sales invalidates.
 *
 * Inline-print (not iframe) was chosen because the print CSS already hides
 * non-print-area body children, and jsdom does not implement iframe
 * `contentDocument.body` reliably for tests.
 *
 * NOTE: The consumer is responsible for portalling the print host to
 * `document.body`. See the docstring on `printingSale` above and the
 * reference implementation in `PosBillPreviewModal`.
 */
export function usePrintReceipt(): IUsePrintReceiptReturn {
    const [printingSale, setPrintingSale] = useState<ISale | null>(null);
    const markPrinted = usePosMarkPrinted();

    const printReceipt = useCallback(
        async (sale: ISale): Promise<void> => {
            setPrintingSale(sale);
            // Swap document.title so the browser's "Save as PDF" default
            // filename and the printer-queue entry both read as the sale's
            // invoice number (e.g. "INV-2026-001234.pdf") instead of the
            // SPA's static "Ledger Pro" title. Restored on afterprint.
            const previousTitle = document.title;
            document.title = sale.invoiceNumber || previousTitle;
            // Defer to the next animation frame so React commits the bill
            // template into the DOM before the browser captures it for print.
            return new Promise<void>((resolve) => {
                const handleAfterPrint = () => {
                    window.removeEventListener('afterprint', handleAfterPrint);
                    document.title = previousTitle;
                    setPrintingSale(null);
                    markPrinted.mutate(sale.id, {
                        onSettled: () => resolve(),
                    });
                };
                window.addEventListener('afterprint', handleAfterPrint);
                const frame =
                    typeof window.requestAnimationFrame === 'function'
                        ? window.requestAnimationFrame
                        : (cb: FrameRequestCallback) =>
                              window.setTimeout(() => cb(0), 0);
                frame(() => {
                    try {
                        window.print();
                    } catch {
                        // jsdom (and some kiosk shells) may not implement
                        // window.print(); still fire afterprint so the
                        // caller's promise resolves and state clears.
                        window.dispatchEvent(new Event('afterprint'));
                    }
                });
            });
        },
        [markPrinted],
    );

    return { printingSale, printReceipt };
}
