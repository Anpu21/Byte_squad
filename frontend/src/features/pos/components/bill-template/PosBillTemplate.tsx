import { forwardRef } from 'react';
import type { ISale } from '@/types';
import { PosBillItemRows } from './PosBillItemRows';
import { PosBillTotalsBlock } from './PosBillTotalsBlock';
import { PosBillLoyaltyFooter } from './PosBillLoyaltyFooter';
import './pos-bill-template.css';

interface IPosBillTemplateProps {
    sale: ISale;
    businessName?: string;
    businessAddress?: string;
}

/**
 * Pure renderer for an 80mm thermal-receipt-style layout. Designed to be
 * mounted either inside a hidden print iframe or as a `data-pos-print-area`
 * region in the main document — the @media print rules in
 * `pos-bill-template.css` hide every other body child at print time so a
 * single bill prints cleanly regardless of which approach the caller picks.
 *
 * The component never fetches; the caller supplies a fully populated Sale
 * (items + payment + customer relations eager-loaded) so the renderer
 * stays deterministic and snapshot-testable.
 */
export const PosBillTemplate = forwardRef<HTMLDivElement, IPosBillTemplateProps>(
    function PosBillTemplate(
        { sale, businessName = 'LedgerPro', businessAddress },
        ref,
    ) {
        const items = sale.items ?? [];
        const payment = sale.payment ?? null;
        const customerLabel = formatCustomerLine(sale);
        const printedAt = formatDateTime(sale.createdAt);
        // The first printed copy (count=1) is the original receipt — only
        // count >= 2 is a genuine re-print.
        const isReprint = sale.billPrintCount > 1;

        return (
            <div
                ref={ref}
                data-pos-print-area
                className="font-mono text-[11px] leading-tight text-text-1 bg-surface mx-auto p-4 max-w-[320px] w-full"
            >
                <header className="text-center">
                    <p className="text-[14px] font-bold tracking-tight">
                        {businessName}
                    </p>
                    {businessAddress ? (
                        <p className="text-[10px] text-text-2 mt-0.5">
                            {businessAddress}
                        </p>
                    ) : null}
                    <hr className="pos-bill__divider my-2 border-t border-dashed border-border" />
                    <p className="text-[13px] font-bold tabular-nums">
                        {sale.invoiceNumber}
                    </p>
                    <p className="text-[10px] mt-1 text-text-2">{printedAt}</p>
                </header>

                <hr className="pos-bill__divider my-2 border-t border-dashed border-border" />

                <p className="text-[11px]">{customerLabel}</p>

                <hr className="pos-bill__divider my-2 border-t border-dashed border-border" />

                <table className="pos-bill__items w-full text-left">
                    <tbody>
                        {items.map((item) => (
                            <PosBillItemRows key={item.id} item={item} />
                        ))}
                    </tbody>
                </table>

                <hr className="pos-bill__divider my-2 border-t border-dashed border-border" />

                <PosBillTotalsBlock sale={sale} payment={payment} />

                {sale.loyalty ? (
                    <>
                        <hr className="pos-bill__divider my-2 border-t border-dashed border-border" />
                        <PosBillLoyaltyFooter loyalty={sale.loyalty} />
                    </>
                ) : null}

                <hr className="pos-bill__divider my-2 border-t border-dashed border-border" />

                <footer className="text-center mt-2">
                    <p className="text-[11px] font-semibold">
                        Thank you for shopping!
                    </p>
                    {isReprint ? (
                        <p className="text-[10px] text-text-2 mt-1">
                            Reprint #{sale.billPrintCount}
                        </p>
                    ) : null}
                </footer>
            </div>
        );
    },
);

function formatCustomerLine(sale: ISale): string {
    if (sale.customer) {
        const first = sale.customer.firstName ?? '';
        const last = sale.customer.lastName ?? '';
        const name = `${first} ${last}`.trim();
        return name ? `Customer: ${name}` : 'Walk-in customer';
    }
    if (sale.customerUserId) {
        return 'Customer: (unnamed)';
    }
    return 'Walk-in customer';
}

function formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const date = d.toISOString().slice(0, 10);
    const time = d.toTimeString().slice(0, 5);
    return `${date} ${time}`;
}
