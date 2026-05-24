import { formatCurrency } from '@/lib/utils';
import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';

interface IPosCashTenderFormProps {
    invoiceTotal: number;
    cashTendered: number;
    onCashTenderedChange: (next: number) => void;
}

/**
 * Cash tender form for the Shanel multi-tender flow. The cashier types the
 * amount handed over (`cashTendered`). Cash applied is capped at the
 * invoice total so any extra is presented as change rather than overpayment.
 *
 * Cash applied + change are derived inline (not via `calculateMultiTender`)
 * because the orchestrator already runs the full calc — keeping this form
 * pure-display avoids two competing sources of truth and makes the spec
 * focus on `cashTendered` plumbing.
 */
export function PosCashTenderForm({
    invoiceTotal,
    cashTendered,
    onCashTenderedChange,
}: IPosCashTenderFormProps) {
    const cashApplied = Math.min(Math.max(0, cashTendered), invoiceTotal);
    const cashChange = Math.max(0, cashTendered - cashApplied);

    return (
        <div className="flex flex-col gap-3">
            <div>
                <label className="block text-xs font-medium text-text-2 mb-1.5">
                    Cash tendered
                </label>
                <PosCartNumericCell
                    value={cashTendered}
                    onCommit={onCashTenderedChange}
                    min={0}
                    ariaLabel="Cash tendered"
                    className="w-full h-[42px] px-3 bg-surface border border-border-strong rounded-md text-[14px] text-text-1 tabular-nums outline-none transition-colors focus:border-primary focus:ring-[3px] focus:ring-primary/30"
                />
                <p className="mt-1.5 text-[11px] text-text-3">
                    Enter what the customer handed over, including any
                    overpay you will return as change.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-surface-2 p-3">
                <SummaryRow
                    label="Cash applied"
                    value={formatCurrency(cashApplied)}
                    emphasis="primary"
                />
                <SummaryRow
                    label="Change"
                    value={formatCurrency(cashChange)}
                    emphasis={cashChange > 0 ? 'change' : 'muted'}
                />
            </div>
        </div>
    );
}

interface ISummaryRowProps {
    label: string;
    value: string;
    emphasis: 'primary' | 'change' | 'muted';
}

const EMPHASIS_TONE: Record<ISummaryRowProps['emphasis'], string> = {
    primary: 'text-primary',
    change: 'text-info',
    muted: 'text-text-2',
};

function SummaryRow({ label, value, emphasis }: ISummaryRowProps) {
    return (
        <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wide text-text-3">
                {label}
            </span>
            <span
                className={`mt-0.5 text-[15px] font-semibold tabular-nums ${EMPHASIS_TONE[emphasis]}`}
            >
                {value}
            </span>
        </div>
    );
}
