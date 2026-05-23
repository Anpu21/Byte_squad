import { Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';
import { applyCartDiscount } from './pos-invoice-total.helpers';

export interface IPosInvoiceTotalProps {
    itemsSubtotal: number;
    totalLineDiscount: number;
    totalTax: number;
    /** 0-100. Owned by the parent; the component is pure-display otherwise. */
    cartDiscountPercentage: number;
    onCartDiscountChange: (next: number) => void;
}

/**
 * Five-row totals strip: subtotal, total line discount, editable
 * cart-level discount (%), total tax, and the prominent grand total.
 *
 * The cart-discount input is the only mutable surface here; it reuses
 * `PosCartNumericCell` for its string-buffer + clamp semantics so a
 * cashier can type `0.` without the value snapping back to `0`. Clamp
 * range is [0, 100] (a 0% discount is no-op, a 100% discount zeroes
 * the bill aside from tax).
 *
 * Currency formatting goes through `formatCurrency` (en-LK / LKR) so
 * the receipt and invoice numbers stay consistent across the app.
 */
export function PosInvoiceTotal({
    itemsSubtotal,
    totalLineDiscount,
    totalTax,
    cartDiscountPercentage,
    onCartDiscountChange,
}: IPosInvoiceTotalProps) {
    const { cartDiscountAmount, cartTotal } = applyCartDiscount(
        itemsSubtotal,
        totalLineDiscount,
        totalTax,
        cartDiscountPercentage,
    );

    return (
        <section
            aria-label="Invoice totals"
            className="bg-surface border border-border-strong rounded-lg p-4 flex flex-col gap-2"
        >
            <Row
                label="Subtotal"
                value={formatCurrency(itemsSubtotal)}
            />
            <Row
                label="Line discount"
                value={`− ${formatCurrency(totalLineDiscount)}`}
                muted
            />
            <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-[12px] text-text-2">
                    Cart discount
                </span>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <PosCartNumericCell
                            value={cartDiscountPercentage}
                            onCommit={onCartDiscountChange}
                            min={0}
                            max={100}
                            step={0.1}
                            ariaLabel="Cart discount percentage"
                            className="w-20 h-8 pl-2 pr-7 text-right text-[12px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30"
                        />
                        <Percent
                            size={12}
                            aria-hidden
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                        />
                    </div>
                    <span className="text-[12px] text-text-2 tabular-nums w-24 text-right">
                        − {formatCurrency(cartDiscountAmount)}
                    </span>
                </div>
            </div>
            <Row label="Tax" value={formatCurrency(totalTax)} muted />
            <div className="mt-1 pt-2 border-t border-border-strong flex items-center justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-text-2">
                    Total
                </span>
                <span
                    aria-label="Grand total"
                    className="text-[20px] font-bold tabular-nums text-primary"
                >
                    {formatCurrency(cartTotal)}
                </span>
            </div>
        </section>
    );
}

interface IRowProps {
    label: string;
    value: string;
    muted?: boolean;
}

function Row({ label, value, muted = false }: IRowProps) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-[12px] text-text-2">{label}</span>
            <span
                className={`text-[13px] tabular-nums ${
                    muted ? 'text-text-2' : 'text-text-1 font-medium'
                }`}
            >
                {value}
            </span>
        </div>
    );
}
