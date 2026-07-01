import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import { DataTable, EmptyState, type DataTableColumn } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { accountingService } from '@/services/accounting.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ITrialBalanceRow } from '@/types';
import { INPUT_CLASS } from '../financial-reports.lib';
import { BalancedPill } from './BalancedPill';

/**
 * A trial-balance row is either a mapped account row or the synthetic
 * "Unmapped (pre-chart entries)" row appended after the account rows when
 * there are debits/credits outside the chart of accounts.
 */
type TrialRow =
    | { kind: 'account'; data: ITrialBalanceRow }
    | { kind: 'unmapped'; debits: number; credits: number };

const TRIAL_COLUMNS: DataTableColumn<TrialRow>[] = [
    {
        key: 'account',
        header: 'Account',
        render: (row) =>
            row.kind === 'account' ? (
                <span className="text-text-1">
                    {row.data.accountCode} — {row.data.accountName}
                </span>
            ) : (
                <span className="italic text-text-2">
                    Unmapped (pre-chart entries)
                </span>
            ),
    },
    {
        key: 'type',
        header: 'Type',
        className: 'text-[12px] text-text-3',
        render: (row) => (row.kind === 'account' ? row.data.accountType : '—'),
    },
    {
        key: 'debits',
        header: 'Debits',
        align: 'right',
        numeric: true,
        render: (row) =>
            row.kind === 'account' ? (
                <span className="text-text-1">
                    {formatCurrency(row.data.debits)}
                </span>
            ) : (
                <span className="text-text-2">{formatCurrency(row.debits)}</span>
            ),
    },
    {
        key: 'credits',
        header: 'Credits',
        align: 'right',
        numeric: true,
        render: (row) =>
            row.kind === 'account' ? (
                <span className="text-text-1">
                    {formatCurrency(row.data.credits)}
                </span>
            ) : (
                <span className="text-text-2">
                    {formatCurrency(row.credits)}
                </span>
            ),
    },
];

export function TrialBalanceTab() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const trialQuery = useQuery({
        queryKey: queryKeys.ledger.trialBalance({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        }),
        queryFn: () =>
            accountingService.getTrialBalance({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            }),
    });
    const trial = trialQuery.data;
    const trialRows: TrialRow[] = trial
        ? [
              ...trial.rows.map(
                  (data): TrialRow => ({ kind: 'account', data }),
              ),
              ...(trial.unmappedDebits > 0 || trial.unmappedCredits > 0
                  ? [
                        {
                            kind: 'unmapped',
                            debits: trial.unmappedDebits,
                            credits: trial.unmappedCredits,
                        } satisfies TrialRow,
                    ]
                  : []),
          ]
        : [];

    return (
        <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                <input
                    className={`${INPUT_CLASS}${startDate ? '' : ' date-empty'}`}
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-label="Start date"
                />
                <span className="text-text-3 text-sm">→</span>
                <input
                    className={`${INPUT_CLASS}${endDate ? '' : ' date-empty'}`}
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    aria-label="End date"
                />
                <div className="ml-auto">
                    {trial && <BalancedPill balanced={trial.balanced} />}
                </div>
            </div>
            <DataTable<TrialRow>
                columns={TRIAL_COLUMNS}
                rows={trialRows}
                getRowKey={(row, i) =>
                    row.kind === 'account'
                        ? row.data.accountCode
                        : `unmapped-${i}`
                }
                isLoading={trialQuery.isLoading}
                zebra
                footerRow={
                    trial ? (
                        <tr className="font-semibold text-text-1">
                            <td className="px-4 py-3.5 text-[13px]">Totals</td>
                            <td />
                            <td className="px-4 py-3.5 text-right text-[13px] tabular-nums">
                                {formatCurrency(trial.totalDebits)}
                            </td>
                            <td className="px-4 py-3.5 text-right text-[13px] tabular-nums">
                                {formatCurrency(trial.totalCredits)}
                            </td>
                        </tr>
                    ) : undefined
                }
                empty={
                    <EmptyState title="No trial-balance rows for this range" />
                }
            />
        </Card>
    );
}
