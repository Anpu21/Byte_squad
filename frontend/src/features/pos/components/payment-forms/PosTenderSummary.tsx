import { formatCurrency } from '@/lib/utils';
import type { IMultiTenderResult } from '@/features/pos/lib/multi-tender';

interface IPosTenderSummaryProps {
    invoiceTotal: number;
    /** Null when the multi-tender calc threw — the orchestrator surfaces a banner. */
    calc: IMultiTenderResult | null;
}

/**
 * Live mini-ledger surfaced under the active form. Shows invoice total,
 * tender total, what we'd settle on the invoice, change due, and any
 * surplus that would be kept as customer credit. When the calc fails we
 * fall back to the invoice line alone; the orchestrator owns the error
 * banner so the summary stays passive.
 */
export function PosTenderSummary({
    invoiceTotal,
    calc,
}: IPosTenderSummaryProps) {
    return (
        <section
            aria-label="Tender summary"
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-md border border-border bg-surface-2 p-3"
        >
            <Row label="Invoice total" value={formatCurrency(invoiceTotal)} />
            <Row
                label="Tender total"
                value={formatCurrency(calc?.paymentAmount ?? 0)}
            />
            <Row
                label="Paid"
                value={formatCurrency(calc?.paidAmount ?? 0)}
                emphasis="primary"
            />
            <Row
                label="Change"
                value={formatCurrency(calc?.cashChange ?? 0)}
                emphasis={
                    (calc?.cashChange ?? 0) > 0 ? 'info' : 'muted'
                }
            />
            <Row
                label="Balance due"
                value={formatCurrency(calc?.balanceDue ?? 0)}
                emphasis={
                    (calc?.balanceDue ?? 0) > 0 ? 'danger' : 'muted'
                }
            />
            <Row
                label="Kept as credit"
                value={formatCurrency(calc?.overpayKeptBalance ?? 0)}
                emphasis={
                    (calc?.overpayKeptBalance ?? 0) > 0
                        ? 'info'
                        : 'muted'
                }
            />
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
