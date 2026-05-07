import { useState, useEffect, useRef, useCallback } from 'react';
import { accountingService } from '@/services/accounting.service';
import type { ILedgerEntry, ILedgerSummary } from '@/services/accounting.service';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import {
    exportData,
    type ExportColumn,
    type ExportFormat,
} from '@/lib/exportUtils';
import ExportMenu from '@/components/common/ExportMenu';

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

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 20;

    // Filters
    const [entryType, setEntryType] = useState('all');
    const [accountType, setAccountType] = useState('all');
    const [timePeriod, setTimePeriod] = useState('');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Debounce search
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const applyDebouncedSearch = useCallback((value: string) => {
        setDebouncedSearch(value);
        setPage(1);
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => applyDebouncedSearch(search), 300);
        return () => clearTimeout(debounceRef.current);
    }, [search, applyDebouncedSearch]);

    // Handle time period preset changes
    const handleTimePeriodChange = useCallback((period: string) => {
        setTimePeriod(period);
        setPage(1);
        const now = new Date();
        if (period === 'this_month') {
            setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
        } else if (period === 'last_month') {
            setStartDate(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]);
            setEndDate(new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]);
        } else if (period === 'this_year') {
            setStartDate(new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
        } else {
            setStartDate('');
            setEndDate('');
        }
    }, []);

    // Handle account type filter (maps to entry type or description-based search)
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

    // Fetch entries
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
        return () => { cancelled = true; };
    }, [entryType, startDate, endDate, debouncedSearch, page]);

    // Fetch summary once
    useEffect(() => {
        accountingService.getLedgerSummary().then(setSummary).catch(() => {});
    }, []);

    const formatPeriodLabel = (): string => {
        if (!startDate && !endDate) return 'All Time';
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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">General Ledger</h1>
                    <p className="text-sm text-text-2 mt-1">View and manage all financial transactions</p>
                </div>
                <ExportMenu
                    onExport={handleExport}
                    disabled={total === 0}
                    isPreparing={isExporting}
                />
            </div>

            {error && (
                <div className="mb-6 p-4 bg-danger-soft border border-danger/30 rounded-xl text-sm text-danger">
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-surface border border-border rounded-md p-5">
                        <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-2">Total Credits</p>
                        <p className="text-xl font-bold text-text-1 tabular-nums">{formatCurrency(summary.totalCredits)}</p>
                    </div>
                    <div className="bg-surface border border-border rounded-md p-5">
                        <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-2">Total Debits</p>
                        <p className="text-xl font-bold text-text-1 tabular-nums">{formatCurrency(summary.totalDebits)}</p>
                    </div>
                    <div className="bg-surface border border-border rounded-md p-5">
                        <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-2">Net Balance</p>
                        <p className="text-xl font-bold tabular-nums text-text-1">
                            {formatCurrency(summary.netBalance)}
                        </p>
                    </div>
                    <div className="bg-surface border border-border rounded-md p-5">
                        <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-2">Total Entries</p>
                        <p className="text-xl font-bold text-text-1">{summary.entryCount}</p>
                    </div>
                </div>
            )}

            {/* Main Table Card */}
            <div className="bg-surface border border-border rounded-md shadow-2xl flex flex-col overflow-hidden">
                {/* Filters */}
                <div className="p-5 border-b border-border flex flex-col sm:flex-row items-center gap-4 justify-between bg-surface-2">
                    <div className="relative w-full sm:w-72">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search description or reference..."
                            className="w-full h-9 pl-9 pr-4 bg-canvas border border-border rounded-lg text-sm text-text-1 outline-none focus:border-primary/40 transition-colors placeholder:text-text-3"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                        <select
                            value={accountType}
                            onChange={(e) => handleAccountTypeChange(e.target.value)}
                            className="h-9 bg-canvas border border-border text-text-1 text-sm rounded-lg px-3 outline-none focus:border-primary/40"
                        >
                            <option value="all">All Accounts</option>
                            <option value="assets">Assets</option>
                            <option value="liabilities">Liabilities</option>
                            <option value="equity">Equity</option>
                        </select>
                        <select
                            value={entryType}
                            onChange={(e) => setEntryType(e.target.value)}
                            className="h-9 bg-canvas border border-border text-text-1 text-sm rounded-lg px-3 outline-none focus:border-primary/40"
                        >
                            <option value="all">All Types</option>
                            <option value="credit">Credit</option>
                            <option value="debit">Debit</option>
                        </select>
                        <select
                            value={timePeriod}
                            onChange={(e) => handleTimePeriodChange(e.target.value)}
                            className="h-9 bg-canvas border border-border text-text-1 text-sm rounded-lg px-3 outline-none focus:border-primary/40"
                        >
                            <option value="">All Time</option>
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="this_year">This Year</option>
                        </select>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setTimePeriod(''); }}
                            className="h-9 px-3 bg-canvas border border-border text-text-1 text-sm rounded-lg outline-none focus:border-primary/40"
                        />
                        <span className="text-text-3 text-sm">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setTimePeriod(''); }}
                            className="h-9 px-3 bg-canvas border border-border text-text-1 text-sm rounded-lg outline-none focus:border-primary/40"
                        />
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="px-6 py-4 flex items-center gap-6 border-b border-border">
                                <div className="h-4 w-20 bg-surface-2 rounded animate-pulse" />
                                <div className="h-4 w-48 bg-surface-2 rounded animate-pulse flex-1" />
                                <div className="h-4 w-24 bg-surface-2 rounded animate-pulse" />
                                <div className="h-4 w-24 bg-surface-2 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                        <div className="w-16 h-16 bg-surface-2 border border-border rounded-md flex items-center justify-center mb-6">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-text-1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                                <path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-text-1 mb-2">No ledger entries found</h3>
                        <p className="text-sm text-text-2 max-w-[280px]">
                            {debouncedSearch || entryType !== 'all' || startDate || endDate
                                ? 'No entries match your current filters. Try adjusting your search.'
                                : 'Ledger entries will appear here when POS sales or expenses are recorded.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border text-[11px] uppercase tracking-widest text-text-3 bg-canvas/50">
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Date</th>
                                    <th className="px-6 py-4 font-semibold">Description</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Reference</th>
                                    <th className="px-6 py-4 font-semibold text-right">Debit</th>
                                    <th className="px-6 py-4 font-semibold text-right">Credit</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {entries.map((entry) => (
                                    <tr
                                        key={entry.id}
                                        className="border-b border-border hover:bg-surface-2 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-text-2 whitespace-nowrap tabular-nums">
                                            {new Date(entry.createdAt).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-text-1 font-medium">
                                            {entry.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-text-1 font-medium text-xs bg-surface-2 px-2 py-1 rounded border border-border">
                                                {entry.referenceNumber}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums">
                                            {entry.entryType === 'debit' ? (
                                                <span className="text-text-1 font-medium">
                                                    {formatCurrency(Number(entry.amount))}
                                                </span>
                                            ) : (
                                                <span className="text-text-3">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums">
                                            {entry.entryType === 'credit' ? (
                                                <span className="text-text-1 font-medium">
                                                    {formatCurrency(Number(entry.amount))}
                                                </span>
                                            ) : (
                                                <span className="text-text-3">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 0 && !isLoading && entries.length > 0 && (
                    <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-3 bg-canvas/50">
                        <span>
                            Showing {showFrom} to {showTo} of {total} entries
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 rounded border border-border hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                                        className={`px-3 py-1.5 rounded border border-border transition-colors ${
                                            pageNum === page
                                                ? 'bg-primary-soft text-text-1 font-medium'
                                                : 'hover:bg-surface-2 hover:text-text-1'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-3 py-1.5 rounded border border-border hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
