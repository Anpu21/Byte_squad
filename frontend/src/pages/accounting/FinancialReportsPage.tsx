import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BookOpenCheck,
    CalendarDays,
    Scale,
    type LucideIcon,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import Pill from '@/components/ui/Pill';
import { formatCurrency } from '@/lib/utils';
import { accountingService } from '@/services/accounting.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IBalanceSheetLine } from '@/types';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

type ReportTab = 'trial-balance' | 'balance-sheet' | 'day-book';

const TABS: { key: ReportTab; label: string; Icon: LucideIcon }[] = [
    { key: 'trial-balance', label: 'Trial balance', Icon: Scale },
    { key: 'balance-sheet', label: 'Balance sheet', Icon: BookOpenCheck },
    { key: 'day-book', label: 'Day book', Icon: CalendarDays },
];

function BalancedPill({ balanced }: { balanced: boolean }) {
    return (
        <Pill tone={balanced ? 'success' : 'danger'}>
            {balanced ? 'Balanced' : 'Out of balance'}
        </Pill>
    );
}

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

/**
 * The three classic statements over the account-dimensioned ledger —
 * trial balance (with the books' equality check), balance sheet (with
 * virtual retained earnings), and the day book. Admin only.
 */
export function FinancialReportsPage() {
    const [tab, setTab] = useState<ReportTab>('trial-balance');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [asOf, setAsOf] = useState('');
    const [day, setDay] = useState('');

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
        enabled: tab === 'trial-balance',
    });
    const sheetQuery = useQuery({
        queryKey: queryKeys.ledger.balanceSheet({ asOf: asOf || undefined }),
        queryFn: () =>
            accountingService.getBalanceSheet({ asOf: asOf || undefined }),
        enabled: tab === 'balance-sheet',
    });
    const dayQuery = useQuery({
        queryKey: queryKeys.ledger.dayBook({ date: day || undefined }),
        queryFn: () => accountingService.getDayBook({ date: day || undefined }),
        enabled: tab === 'day-book',
    });

    const trial = trialQuery.data;
    const sheet = sheetQuery.data;
    const book = dayQuery.data;

    return (
        <div>
            <PageHeader
                eyebrow="Accounting"
                title="Financial reports"
                subtitle="Trial balance, balance sheet, and the day book — straight off the account-dimensioned ledger."
            />

            <div
                className="flex items-center gap-1 mb-6 p-1 bg-surface-2 rounded-xl border border-border w-fit overflow-x-auto"
                role="tablist"
                aria-label="Financial report views"
            >
                {TABS.map((t) => {
                    const isActive = tab === t.key;
                    const { Icon } = t;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-[3px] focus:ring-primary/30 ${
                                isActive
                                    ? 'bg-primary text-text-inv shadow-sm'
                                    : 'text-text-2 hover:text-text-1 hover:bg-surface'
                            }`}
                        >
                            <Icon size={14} strokeWidth={2} aria-hidden />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {tab === 'trial-balance' && (
                <Card className="overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                        <input
                            className={INPUT_CLASS}
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            aria-label="Start date"
                        />
                        <span className="text-text-3 text-sm">→</span>
                        <input
                            className={INPUT_CLASS}
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            aria-label="End date"
                        />
                        <div className="ml-auto">
                            {trial && <BalancedPill balanced={trial.balanced} />}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-2/60 border-b border-border">
                                <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                    <th className="px-3 py-2.5 font-medium">
                                        Account
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Type
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Debits
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Credits
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(trial?.rows ?? []).map((r) => (
                                    <tr
                                        key={r.accountCode}
                                        className="border-b border-border"
                                    >
                                        <td className="px-3 py-2 text-[13px] text-text-1">
                                            {r.accountCode} — {r.accountName}
                                        </td>
                                        <td className="px-3 py-2 text-[12px] text-text-3">
                                            {r.accountType}
                                        </td>
                                        <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-1">
                                            {formatCurrency(r.debits)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-1">
                                            {formatCurrency(r.credits)}
                                        </td>
                                    </tr>
                                ))}
                                {trial &&
                                    (trial.unmappedDebits > 0 ||
                                        trial.unmappedCredits > 0) && (
                                        <tr className="border-b border-border bg-surface-2/30">
                                            <td className="px-3 py-2 text-[13px] italic text-text-2">
                                                Unmapped (pre-chart entries)
                                            </td>
                                            <td className="px-3 py-2 text-[12px] text-text-3">
                                                —
                                            </td>
                                            <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-2">
                                                {formatCurrency(
                                                    trial.unmappedDebits,
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-2">
                                                {formatCurrency(
                                                    trial.unmappedCredits,
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                {trial && (
                                    <tr className="font-semibold text-text-1">
                                        <td className="px-3 py-2.5 text-[13px]">
                                            Totals
                                        </td>
                                        <td />
                                        <td className="px-3 py-2.5 text-right text-[13px] tabular-nums">
                                            {formatCurrency(trial.totalDebits)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-[13px] tabular-nums">
                                            {formatCurrency(
                                                trial.totalCredits,
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {tab === 'balance-sheet' && (
                <Card className="p-5 space-y-5 max-w-2xl">
                    <div className="flex items-center gap-2">
                        <label className="text-[11px] uppercase tracking-wide text-text-3">
                            As of
                        </label>
                        <input
                            className={INPUT_CLASS}
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
                                    <span>
                                        Retained earnings (income − expenses)
                                    </span>
                                    <span className="tabular-nums text-text-1">
                                        {formatCurrency(
                                            sheet.retainedEarnings,
                                        )}
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
                                <span>
                                    Assets = Liabilities + Equity
                                </span>
                                <span className="tabular-nums">
                                    {formatCurrency(sheet.totalAssets)} ={' '}
                                    {formatCurrency(
                                        sheet.totalLiabilities +
                                            sheet.totalEquity,
                                    )}
                                </span>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {tab === 'day-book' && (
                <Card className="overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                        <input
                            className={INPUT_CLASS}
                            type="date"
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                            aria-label="Day"
                        />
                        {book && (
                            <span className="ml-auto text-sm text-text-2 tabular-nums">
                                Dr {formatCurrency(book.totalDebits)} · Cr{' '}
                                {formatCurrency(book.totalCredits)} ·{' '}
                                {book.rows.length} entries
                            </span>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-2/60 border-b border-border">
                                <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                    <th className="px-3 py-2.5 font-medium">
                                        Time
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Ref
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Account
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Description
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Debit
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Credit
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(book?.rows ?? []).map((r) => (
                                    <tr
                                        key={r.id}
                                        className="border-b border-border"
                                    >
                                        <td className="px-3 py-2 text-[12px] text-text-3 whitespace-nowrap">
                                            {new Date(
                                                r.createdAt,
                                            ).toLocaleTimeString()}
                                        </td>
                                        <td className="px-3 py-2 text-[12px] text-text-2 mono">
                                            {r.referenceNumber}
                                        </td>
                                        <td className="px-3 py-2 text-[13px] text-text-1">
                                            {r.accountCode
                                                ? `${r.accountCode} — ${r.accountName}`
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-[12px] text-text-2 max-w-[280px] truncate">
                                            {r.description}
                                        </td>
                                        <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-1">
                                            {r.entryType === 'debit'
                                                ? formatCurrency(r.amount)
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-1">
                                            {r.entryType === 'credit'
                                                ? formatCurrency(r.amount)
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                                {book && book.rows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-3 py-6 text-center text-sm text-text-3"
                                        >
                                            No postings on this day.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
