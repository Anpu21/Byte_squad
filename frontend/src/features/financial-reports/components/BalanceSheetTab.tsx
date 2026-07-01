import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { accountingService } from '@/services/accounting.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IBalanceSheetLine } from '@/types';
import { INPUT_CLASS } from '../financial-reports.lib';
import { BalancedPill } from './BalancedPill';

function SheetSection({
    title,
    lines,
    total,
}: {
    title: string;
    lines: IBalanceSheetLine[];
    total: number;
}) {
    return (
        <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-text-3">
                {title}
            </p>
            {lines.map((l) => (
                <div
                    key={l.accountCode}
                    className="flex justify-between text-[13px] text-text-2"
                >
                    <span>
                        {l.accountCode} — {l.accountName}
                    </span>
                    <span className="tabular-nums text-text-1">
                        {formatCurrency(l.balance)}
                    </span>
                </div>
            ))}
            <div className="flex justify-between pt-1 border-t border-border text-[13px] font-semibold text-text-1">
                <span>Total {title.toLowerCase()}</span>
                <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
        </div>
    );
}

export function BalanceSheetTab() {
    const [asOf, setAsOf] = useState('');
    const sheetQuery = useQuery({
        queryKey: queryKeys.ledger.balanceSheet({ asOf: asOf || undefined }),
        queryFn: () =>
            accountingService.getBalanceSheet({ asOf: asOf || undefined }),
    });
    const sheet = sheetQuery.data;

    return (
        <Card className="p-5 space-y-5 max-w-2xl">
            <div className="flex items-center gap-2">
                <label className="text-[11px] uppercase tracking-wide text-text-3">
                    As of
                </label>
                <input
                    className={`${INPUT_CLASS}${asOf ? '' : ' date-empty'}`}
                    type="date"
                    value={asOf}
                    onChange={(e) => setAsOf(e.target.value)}
                    aria-label="As of date"
                />
                <div className="ml-auto">
                    {sheet && <BalancedPill balanced={sheet.balanced} />}
                </div>
            </div>
            {sheet && (
                <>
                    <SheetSection
                        title="Assets"
                        lines={sheet.assets}
                        total={sheet.totalAssets}
                    />
                    <SheetSection
                        title="Liabilities"
                        lines={sheet.liabilities}
                        total={sheet.totalLiabilities}
                    />
                    <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-text-3">
                            Equity
                        </p>
                        {sheet.equity.map((l) => (
                            <div
                                key={l.accountCode}
                                className="flex justify-between text-[13px] text-text-2"
                            >
                                <span>
                                    {l.accountCode} — {l.accountName}
                                </span>
                                <span className="tabular-nums text-text-1">
                                    {formatCurrency(l.balance)}
                                </span>
                            </div>
                        ))}
                        <div className="flex justify-between text-[13px] text-text-2">
                            <span>Retained earnings (income − expenses)</span>
                            <span className="tabular-nums text-text-1">
                                {formatCurrency(sheet.retainedEarnings)}
                            </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-border text-[13px] font-semibold text-text-1">
                            <span>Total equity</span>
                            <span className="tabular-nums">
                                {formatCurrency(sheet.totalEquity)}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between p-3 rounded-md border border-border bg-surface-2/40 text-sm font-semibold text-text-1">
                        <span>Assets = Liabilities + Equity</span>
                        <span className="tabular-nums">
                            {formatCurrency(sheet.totalAssets)} ={' '}
                            {formatCurrency(
                                sheet.totalLiabilities + sheet.totalEquity,
                            )}
                        </span>
                    </div>
                </>
            )}
        </Card>
    );
}
