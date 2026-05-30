import { formatCurrency } from '@/lib/utils';
import type { IMultiTenderResult } from '@/features/pos/lib/multi-tender';

interface IPosTenderSummaryProps {
    invoiceTotal: number;
    /** Null when the multi-tender calc threw — the orchestrator surfaces a banner. */
    calc: IMultiTenderResult | null;
}

/**
 * Live mini-ledger surfaced under the active form. Shows the invoice
 * total, the cashier's tender total, and either the change due (cash
 * overpay handed back) or the balance still outstanding when the tender
 * is short. The keep-balance / kept-as-credit row was removed alongside
 * the customer-picker — single-shop retail has no walk-in customer
 * accounts to credit a surplus to. When the calc fails the summary falls
 * back to the invoice line alone; the orchestrator owns the error banner
 * so this surface stays passive.
 */
export function PosTenderSummary({
    invoiceTotal,
    calc,
}: IPosTenderSummaryProps) {
    const change = calc?.cashChange ?? 0;
    const balanceDue = calc?.balanceDue ?? 0;
    return (
        <section
            aria-label="Tender summary"
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-md border border-border bg-surface-2 p-3"
        >
            <Row label="Invoice total" value={formatCurrency(invoiceTotal)} />
            <Row
                label="Tendered"
                value={formatCurrency(calc?.paymentAmount ?? 0)}
            />
            {balanceDue > 0 ? (
                <Row
                    label="Balance due"
                    value={formatCurrency(balanceDue)}
                    emphasis="danger"
                />
            ) : (
                <Row
                    label="Change"
                    value={formatCurrency(change)}
                    emphasis={change > 0 ? 'info' : 'muted'}
                />
            )}
        </section>
    );
}

interface IRowProps {
    label: string;
    value: string;
    emphasis?: 'primary' | 'info' | 'danger' | 'muted';
}

const TONE: Record<NonNullable<IRowProps['emphasis']>, string> = {
    primary: 'text-primary',
    info: 'text-info',
    danger: 'text-danger',
    muted: 'text-text-1',
};

function Row({ label, value, emphasis = 'muted' }: IRowProps) {
    return (
        <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wide text-text-3">
                {label}
            </span>
            <span
                className={`mt-0.5 text-[14px] font-semibold tabular-nums ${TONE[emphasis]}`}
            >
                {value}
            </span>
        </div>
    );
}
