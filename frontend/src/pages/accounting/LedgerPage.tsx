import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { accountingService } from '@/services/accounting.service';
import type { ILedgerEntry, ILedgerSummary } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import {
    exportData,
    type ExportColumn,
    type ExportFormat,
} from '@/lib/exportUtils';
import ExportMenu from '@/components/common/ExportMenu';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

interface LedgerExportRow {
    date: string;
    description: string;
    referenceNumber: string;
    debit: number | null;
    credit: number | null;
}

export default function LedgerPage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<ILedgerEntry[]>([]);
    const [summary, setSummary] = useState<ILedgerSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 20;

    const [entryType, setEntryType] = useState('all');
    const [accountType, setAccountType] = useState('all');
    const [timePeriod, setTimePeriod] = useState('');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const applyDebouncedSearch = useCallback((value: string) => {
        setDebouncedSearch(value);
        setPage(1);
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(
            () => applyDebouncedSearch(search),
            300,
        );
        return () => clearTimeout(debounceRef.current);
    }, [search, applyDebouncedSearch]);

    const handleTimePeriodChange = useCallback((period: string) => {
        setTimePeriod(period);
        setPage(1);
        const now = new Date();
        if (period === 'this_month') {
            setStartDate(
                new Date(now.getFullYear(), now.getMonth(), 1)
                    .toISOString()
                    .split('T')[0],
            );
            setEndDate(now.toISOString().split('T')[0]);
        } else if (period === 'last_month') {
            setStartDate(
                new Date(now.getFullYear(), now.getMonth() - 1, 1)
                    .toISOString()
                    .split('T')[0],
            );
            setEndDate(
                new Date(now.getFullYear(), now.getMonth(), 0)
                    .toISOString()
                    .split('T')[0],
            );
        } else if (period === 'this_year') {
            setStartDate(
                new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
            );
            setEndDate(now.toISOString().split('T')[0]);
        } else {
            setStartDate('');
            setEndDate('');
        }
    }, []);

    const handleAccountTypeChange = useCallback((type: string) => {
        setAccountType(type);
        setPage(1);
        if (type === 'all') {
            setEntryType('all');
        } else if (type === 'assets' || type === 'equity') {
            setEntryType('credit');
        } else if (type === 'liabilities') {
            setEntryType('debit');
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const data = await accountingService.getLedgerEntries({
                    entryType: entryType !== 'all' ? entryType : undefined,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    search: debouncedSearch || undefined,
                    page,
                    limit,
                });
                if (!cancelled) {
                    setEntries(data.items ?? []);
                    setTotal(data.total ?? 0);
                    setTotalPages(data.totalPages ?? 1);
                    setError(null);
                }
            } catch {
                if (!cancelled) setError('Failed to load ledger entries');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [entryType, startDate, endDate, debouncedSearch, page]);

    useEffect(() => {
        accountingService.getLedgerSummary().then(setSummary).catch(() => {});
    }, []);

    const formatPeriodLabel = (): string => {
        if (!startDate && !endDate) return 'All time';
        const fmt = (s: string) =>
            new Date(s).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
        if (startDate) return `From ${fmt(startDate)}`;
        return `Up to ${fmt(endDate)}`;
    };

    // Compute running balance for visible page (asc order = older first)
    const entriesWithBalance = useMemo(() => {
        const sorted = [...entries].sort(
            (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        let bal = 0;
        const withBal = sorted.map((e) => {
            const credit = e.entryType === 'credit' ? Number(e.amount) : 0;
            const debit = e.entryType === 'debit' ? Number(e.amount) : 0;
            bal += credit - debit;
            return { ...e, balance: bal };
        });
        // restore display order: newest first (matches what backend returns)
        return withBal.reverse();
    }, [entries]);

    const handleExport = async (format: ExportFormat) => {
        try {
            setIsExporting(true);
            const data = await accountingService.getLedgerEntries({
                entryType: entryType !== 'all' ? entryType : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                search: debouncedSearch || undefined,
                page: 1,
                limit: 10000,
            });
            const allEntries = data.items ?? [];

            const exportRows: LedgerExportRow[] = allEntries.map((e) => ({
                date: e.createdAt,
                description: e.description,
                referenceNumber: e.referenceNumber,
                debit: e.entryType === 'debit' ? Number(e.amount) : null,
                credit: e.entryType === 'credit' ? Number(e.amount) : null,
            }));

            const columns: ExportColumn<LedgerExportRow>[] = [
                { header: 'Date', key: 'date', format: 'date' },
                { header: 'Description', key: 'description' },
                { header: 'Reference', key: 'referenceNumber' },
                {
                    header: 'Debit',
                    key: 'debit',
                    align: 'right',
                    format: 'currency',
                    footer: 'sum',
                },
                {
                    header: 'Credit',
                    key: 'credit',
                    align: 'right',
                    format: 'currency',
                    footer: 'sum',
                },
            ];

            const summaryItems = summary
                ? [
                      {
                          label: 'Total Credits',
                          value: formatCurrency(summary.totalCredits),
                      },
                      {
                          label: 'Total Debits',
                          value: formatCurrency(summary.totalDebits),
                      },
                      {
                          label: 'Net Balance',
                          value: formatCurrency(summary.netBalance),
                      },
                      {
                          label: 'Total Entries',
                          value: String(summary.entryCount),
                      },
                  ]
                : undefined;

            await exportData(format, exportRows, columns, {
                title: 'General Ledger',
                subtitle: formatPeriodLabel(),
                filenameBase: 'ledger',
                companyName: 'LedgerPro',
                generatedBy: user
                    ? `${user.firstName} ${user.lastName}`
                    : undefined,
                summary: summaryItems,
            });
        } catch {
            setError('Failed to export ledger entries');
        } finally {
            setIsExporting(false);
        }
    };

    const showFrom = total > 0 ? (page - 1) * limit + 1 : 0;
    const showTo = Math.min(page * limit, total);
    const inputClass =
        'h-9 px-3 bg-surface border border-border-strong text-text-1 text-sm rounded-md outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors';

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        General ledger
                    </h1>
                    <p className="text-xs text-text-2 mt-1">
                        Period:{' '}
                        <span className="text-text-1 font-medium">
                            {formatPeriodLabel()}
                        </span>
                        {summary && (
                            <>
                                {' '}·{' '}
                                <span className="mono">{summary.entryCount}</span>{' '}
                                entries
                            </>
                        )}
                    </p>
                </div>
                <ExportMenu
                    onExport={handleExport}
                    disabled={total === 0}
                    isPreparing={isExporting}
                />
            </div>

            {error && (
                <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
                    {error}
                </div>
            )}

            {/* Summary cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="p-5">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                            Total credits
                        </p>
                        <p className="mono text-xl font-semibold text-accent-text">
                            {formatCurrency(summary.totalCredits)}
                        </p>
                    </Card>
                    <Card className="p-5">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                            Total debits
                        </p>
                        <p className="mono text-xl font-semibold text-text-1">
                            {formatCurrency(summary.totalDebits)}
                        </p>
                    </Card>
                    <Card className="p-5">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                            Net balance
                        </p>
                        <p
                            className={`mono text-xl font-semibold ${
                                summary.netBalance >= 0
                                    ? 'text-accent-text'
                                    : 'text-danger'
                            }`}
                        >
                            {formatCurrency(summary.netBalance)}
                        </p>
                    </Card>
                    <Card className="p-5">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                            Total entries
                        </p>
                        <p className="mono text-xl font-semibold text-text-1">
                            {summary.entryCount}
                        </p>
                    </Card>
                </div>
            )}

            {/* Filters Toolbar */}
            <Card className="p-4 mb-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search description or reference…"
                            className="w-full h-9 pl-9 pr-3 bg-surface border border-border-strong rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 placeholder:text-text-3 transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={accountType}
                            onChange={(e) =>
                                handleAccountTypeChange(e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="all">All accounts</option>
                            <option value="assets">Assets</option>
                            <option value="liabilities">Liabilities</option>
                            <option value="equity">Equity</option>
                        </select>
                        <select
                            value={entryType}
                            onChange={(e) => setEntryType(e.target.value)}
                            className={inputClass}
                        >
                            <option value="all">All types</option>
                            <option value="credit">Credit</option>
                            <option value="debit">Debit</option>
                        </select>
                        <select
                            value={timePeriod}
                            onChange={(e) =>
                                handleTimePeriodChange(e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">All time</option>
                            <option value="this_month">This month</option>
                            <option value="last_month">Last month</option>
                            <option value="this_year">This year</option>
                        </select>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setTimePeriod('');
                            }}
                            className={inputClass}
                        />
                        <span className="text-text-3 text-sm">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setTimePeriod('');
                            }}
                            className={inputClass}
                        />
                    </div>
                </div>
            </Card>

            {/* Journal table */}
            <Card className="overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="h-10 bg-surface-2 rounded-md animate-pulse"
                            />
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <EmptyState
                        icon={<BookOpen size={20} />}
                        title="No ledger entries found"
                        description={
                            debouncedSearch ||
                            entryType !== 'all' ||
                            startDate ||
                            endDate
                                ? 'No entries match your current filters. Try adjusting your search.'
                                : 'Ledger entries will appear here when POS sales or expenses are recorded.'
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2 border-b border-border">
                                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                        Date
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                        Reference
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold">
                                        Description
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold text-right">
                                        Debit
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold text-right">
                                        Credit
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold text-right">
                                        Balance
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {entriesWithBalance.map((entry) => (
                                    <tr
                                        key={entry.id}
                                        className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
                                    >
                                        <td className="px-5 py-3 mono text-xs text-text-2 whitespace-nowrap">
                                            {new Date(
                                                entry.createdAt,
                                            ).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-5 py-3 mono text-xs text-text-1">
                                            {entry.referenceNumber}
                                        </td>
                                        <td className="px-5 py-3 text-[13px] text-text-1">
                                            {entry.description}
                                        </td>
                                        <td className="px-5 py-3 mono text-[13px] text-right">
                                            {entry.entryType === 'debit' ? (
                                                <span className="text-text-1 font-medium">
                                                    {formatCurrency(
                                                        Number(entry.amount),
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-text-3">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 mono text-[13px] text-right">
                                            {entry.entryType === 'credit' ? (
                                                <span className="text-accent-text font-medium">
                                                    {formatCurrency(
                                                        Number(entry.amount),
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-text-3">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td
                                            className={`px-5 py-3 mono text-[13px] font-semibold text-right ${
                                                entry.balance >= 0
                                                    ? 'text-text-1'
                                                    : 'text-danger'
                                            }`}
                                        >
                                            {formatCurrency(entry.balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 0 && !isLoading && entries.length > 0 && (
                    <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-text-3">
                        <span>
                            Showing{' '}
                            <span className="mono text-text-1">{showFrom}</span>{' '}
                            to{' '}
                            <span className="mono text-text-1">{showTo}</span>{' '}
                            of <span className="mono text-text-1">{total}</span>
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-1.5 rounded-md border border-border-strong text-text-2 hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Previous"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            {Array.from(
                                { length: Math.min(totalPages, 5) },
                                (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (page <= 3) {
                                        pageNum = i + 1;
                                    } else if (page >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`min-w-[32px] h-8 px-2 rounded-md border text-xs font-medium transition-colors ${
                                                pageNum === page
                                                    ? 'bg-primary text-text-inv border-primary'
                                                    : 'border-border-strong text-text-2 hover:bg-surface-2 hover:text-text-1'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                },
                            )}
                            <button
                                onClick={() =>
                                    setPage((p) => Math.min(totalPages, p + 1))
                                }
                                disabled={page >= totalPages}
                                className="p-1.5 rounded-md border border-border-strong text-text-2 hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Next"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
