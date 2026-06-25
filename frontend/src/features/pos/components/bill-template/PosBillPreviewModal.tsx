import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuPrinter as Printer } from 'react-icons/lu';
import Modal from '@/components/ui/Modal';
import type { ISale } from '@/types';
import { usePrintReceipt } from '@/features/pos/hooks/usePrintReceipt';
import { PosBillTemplate } from './PosBillTemplate';

interface IPosBillPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: ISale | null;
    businessName?: string;
    businessAddress?: string;
}

/**
 * Modal wrapper around `PosBillTemplate` for the recent-sales re-print
 * flow. The sale is passed in directly (no per-id fetch yet — Phase 14
 * will decide whether to introduce `usePosSaleById`). Two affordances:
 * "Print receipt" (fires the print pipeline + marks the bill printed),
 * and "Close" (dismisses).
 *
 * The actively-printing bill is rendered through `createPortal` into
 * `document.body` (NOT into `#root`). The print stylesheet in
 * `pos-bill-template.css` hides every direct child of body except an
 * element bearing `data-pos-print-area`, so the portalled host is the
 * only thing the OS print dialog captures. Rendering the host inside
 * `#root` (the previous approach) caused the bill to be hidden because
 * `#root` itself was suppressed by the print CSS.
 */
export function PosBillPreviewModal({
    isOpen,
    onClose,
    sale,
    businessName,
    businessAddress,
}: IPosBillPreviewModalProps) {
    const { printingSale, printReceipt } = usePrintReceipt();
    const [isQueuing, setIsQueuing] = useState(false);

    const handlePrint = useCallback(async () => {
        if (!sale) return;
        setIsQueuing(true);
        try {
            await printReceipt(sale);
        } finally {
            setIsQueuing(false);
        }
    }, [printReceipt, sale]);

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Bill preview"
                maxWidth="md"
            >
                {sale ? (
                    <div className="flex flex-col gap-4">
                        <div className="border border-border rounded-md bg-surface-2 p-3 max-h-[50vh] overflow-y-auto">
                            <PosBillTemplate
                                sale={sale}
                                businessName={businessName}
                                businessAddress={businessAddress}
                            />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex items-center justify-center h-9 px-3 rounded-md text-[13px] font-medium text-text-2 hover:bg-surface-2 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={handlePrint}
                                disabled={isQueuing}
                                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-primary text-text-inv text-[13px] font-semibold hover:bg-primary-hover transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/40 disabled:opacity-60 disabled:pointer-events-none"
                            >
                                <Printer size={14} aria-hidden />
                                {isQueuing ? 'Printing…' : 'Print receipt'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-[13px] text-text-3 text-center py-6">
                        Select a sale to preview its bill.
                    </p>
                )}
            </Modal>
            {printingSale
                ? createPortal(
                      <div
                          data-pos-print-area
                          aria-hidden
                          style={{
                              position: 'absolute',
                              left: -10000,
                              top: 0,
                          }}
                      >
                          <PosBillTemplate
                              sale={printingSale}
                              businessName={businessName}
                              businessAddress={businessAddress}
                          />
                      </div>,
                      document.body,
                  )
                : null}
        </>
    );
}
