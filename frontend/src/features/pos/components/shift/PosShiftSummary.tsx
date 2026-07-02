import { formatCurrency } from '@/lib/utils';
import type { IPosShift, IShiftLiveSummary } from '@/types';

interface IPosShiftSummaryProps {
    /** Snapshot when closed, otherwise the open shift (for float/opening). */
    summary: IPosShift;
    /** Live drawer numbers while the shift is open. */
    live: IShiftLiveSummary | null;
    /** True once the shift is closed — read snapshot columns over live. */
    showResult: boolean;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-[13px] text-text-2">
            <span>{label}</span>
            <span className="tabular-nums text-text-1">{value}</span>
        </div>
    );
}

/**
 * Drawer reconciliation panel shared by the close flow: tenders, refunds,
 * mid-shift pay-in/out, then opening float and expected cash. Reads the
 * shift's snapshot columns once closed, the live summary while open.
 */
export function PosShiftSummary({
    summary,
    live,
    showResult,
}: IPosShiftSummaryProps) {
    const money = (snapshot: number | null, liveValue: number | undefined) =>
        formatCurrency(Number(showResult ? (snapshot ?? 0) : (liveValue ?? 0)));

    return (
        <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface-2/40">
            <SummaryRow
                label="Sales"
                value={`${showResult ? (summary.salesCount ?? 0) : (live?.salesCount ?? 0)} · ${formatCurrency(
                    Number(
                        showResult
                            ? (summary.salesTotal ?? 0)
                            : (live?.salesTotal ?? 0),
                    ),
                )}`}
            />
            <SummaryRow
                label="Cash takings"
                value={money(summary.totalCash, live?.cash)}
            />
            <SummaryRow
                label="Card"
                value={money(summary.totalElectronic, live?.electronic)}
            />
            <SummaryRow
                label="Cheque / Bank / Credit"
                value={formatCurrency(
                    Number(
                        showResult
                            ? (summary.totalCheque ?? 0)
                            : (live?.cheque ?? 0),
                    ) +
                        Number(
                            showResult
                                ? (summary.totalBank ?? 0)
                                : (live?.bank ?? 0),
                        ) +
                        Number(
                            showResult
                                ? (summary.totalCredit ?? 0)
                                : (live?.credit ?? 0),
                        ),
                )}
            />
            <SummaryRow
                label="Refunds"
                value={money(summary.refundsTotal, live?.refundsTotal)}
            />
            <SummaryRow
                label="Paid in"
                value={money(summary.totalPayIn, live?.payIn)}
            />
            <SummaryRow
                label="Paid out"
                value={money(summary.totalPayOut, live?.payOut)}
            />
            <div className="pt-1.5 border-t border-border">
                <SummaryRow
                    label="Opening float"
                    value={formatCurrency(Number(summary.openingFloat))}
                />
                <SummaryRow
                    label="Expected cash in drawer"
                    value={money(summary.expectedCash, live?.expectedCash)}
                />
            </div>
        </div>
    );
}
