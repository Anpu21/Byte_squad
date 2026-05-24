import { formatCurrency } from '@/lib/utils';
import type { ISale, ISalePayment } from '@/types';

interface IPosBillTotalsBlockProps {
    sale: ISale;
    payment: ISalePayment | null;
}

interface ITotalsRowProps {
    label: string;
    value: string;
    emphasis?: boolean;
    tone?: 'default' | 'danger';
}

/**
 * Right-aligned totals block: subtotal, optional cart discount, optional
 * tax, the bold Total, per-tender amounts, change, kept-balance, and a
 * danger-toned balance-due row when the sale is short-paid. Lives in its
 * own file so the parent template stays under the file-size budget.
 */
export function PosBillTotalsBlock({ sale, payment }: IPosBillTotalsBlockProps) {
    return (
        <dl className="pos-bill__totals w-full space-y-0.5 text-[11px] tabular-nums">
            <TotalsRow label="Subtotal" value={formatCurrency(sale.subtotal)} />
            {sale.discountAmount > 0 ? (
                <TotalsRow
                    label="Cart discount"
                    value={`−${formatCurrency(sale.discountAmount)}`}
                />
            ) : null}
            {sale.taxAmount > 0 ? (
                <TotalsRow label="Tax" value={formatCurrency(sale.taxAmount)} />
            ) : null}
            <TotalsRow
                label="Total"
                value={formatCurrency(sale.total)}
                emphasis
            />
            {payment && payment.cashAmount > 0 ? (
                <TotalsRow
                    label="Cash"
                    value={formatCurrency(payment.cashAmount)}
                />
            ) : null}
            {payment && payment.chequeAmount > 0 ? (
                <TotalsRow
                    label={`Cheque${payment.chequeNo ? ` (${payment.chequeNo})` : ''}`}
                    value={formatCurrency(payment.chequeAmount)}
                />
            ) : null}
            {payment && payment.bankTransferAmount > 0 ? (
                <TotalsRow
                    label={`Bank${payment.bankRef ? ` (${payment.bankRef})` : ''}`}
                    value={formatCurrency(payment.bankTransferAmount)}
                />
            ) : null}
            {payment && payment.creditAmount > 0 ? (
                <TotalsRow
                    label="Credit"
                    value={formatCurrency(payment.creditAmount)}
                />
            ) : null}
            {payment && payment.cashChange > 0 ? (
                <TotalsRow
                    label="Change"
                    value={formatCurrency(payment.cashChange)}
                />
            ) : null}
            {payment && payment.keepBalance && sale.balanceDue < 0 ? (
                <TotalsRow
                    label="Kept as credit"
                    value={formatCurrency(Math.abs(sale.balanceDue))}
                />
            ) : null}
            {sale.balanceDue > 0 ? (
                <TotalsRow
                    label="Balance due"
                    value={formatCurrency(sale.balanceDue)}
                    tone="danger"
                />
            ) : null}
        </dl>
    );
}

function TotalsRow({ label, value, emphasis, tone }: ITotalsRowProps) {
    const base = 'flex items-baseline justify-between';
    const size = emphasis ? 'text-[13px] font-bold' : 'text-[11px]';
    const colour = tone === 'danger' ? 'text-danger font-bold' : '';
    return (
        <div className={`${base} ${size} ${colour}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}
