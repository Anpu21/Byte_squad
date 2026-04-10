import { useState, useEffect, useRef, useCallback } from 'react';
import { accountingService } from '@/services/accounting.service';
import type { ILedgerEntry, ILedgerSummary } from '@/services/accounting.service';

export default function LedgerPage() {
    const [entries, setEntries] = useState<ILedgerEntry[]>([]);
    const [summary, setSummary] = useState<ILedgerSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);

    const handleExport = () => {
        const headers = ['Date', 'Description', 'Reference', 'Type', 'Amount'];
        const rows = entries.map((e) => [
            new Date(e.createdAt).toLocaleDateString('en-GB'),
            `"${e.description}"`,
            e.referenceNumber,
            e.entryType.toUpperCase(),
            Number(e.amount).toFixed(2),
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ledger-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const showFrom = total > 0 ? (page - 1) * limit + 1 : 0;
    const showTo = Math.min(page * limit, total);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">General Ledger</h1>
                    <p className="text-sm text-slate-400 mt-1">View and manage all financial transactions</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={entries.length === 0}
                    className="h-9 px-4 rounded-lg bg-transparent border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Export CSV
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Credits</p>
                        <p className="text-xl font-bold text-white tabular-nums">{formatCurrency(summary.totalCredits)}</p>
                    </div>
                    <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Debits</p>
                        <p className="text-xl font-bold text-white tabular-nums">{formatCurrency(summary.totalDebits)}</p>
                    </div>
                    <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Net Balance</p>
                        <p className="text-xl font-bold tabular-nums text-white">
                            {formatCurrency(summary.netBalance)}
                        </p>
                    </div>
                    <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Entries</p>
                        <p className="text-xl font-bold text-white">{summary.entryCount}</p>
                    </div>
                </div>
            )}

            {/* Main Table Card */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Filters */}
                <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/[0.02]">
                    <div className="relative w-full sm:w-72">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search description or reference..."
                            className="w-full h-9 pl-9 pr-4 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white/30 transition-colors placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                        <select
                            value={accountType}
                            onChange={(e) => handleAccountTypeChange(e.target.value)}
                            className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30"
                        >
                            <option value="all">All Accounts</option>
                            <option value="assets">Assets</option>
                            <option value="liabilities">Liabilities</option>
                            <option value="equity">Equity</option>
                        </select>
                        <select
                            value={entryType}
                            onChange={(e) => setEntryType(e.target.value)}
                            className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30"
                        >
                            <option value="all">All Types</option>
                            <option value="credit">Credit</option>
                            <option value="debit">Debit</option>
                        </select>
                        <select
                            value={timePeriod}
                            onChange={(e) => handleTimePeriodChange(e.target.value)}
                            className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30"
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
                            className="h-9 px-3 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg outline-none focus:border-white/30"
                        />
                        <span className="text-slate-500 text-sm">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setTimePeriod(''); }}
                            className="h-9 px-3 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg outline-none focus:border-white/30"
                        />
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="px-6 py-4 flex items-center gap-6 border-b border-white/5">
                                <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
                                <div className="h-4 w-48 bg-white/5 rounded animate-pulse flex-1" />
                                <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                                <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                        <div className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center mb-6">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-300" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                                <path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">No ledger entries found</h3>
                        <p className="text-sm text-slate-400 max-w-[280px]">
                            {debouncedSearch || entryType !== 'all' || startDate || endDate
                                ? 'No entries match your current filters. Try adjusting your search.'
                                : 'Ledger entries will appear here when POS sales or expenses are recorded.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-slate-500 bg-[#0a0a0a]/50">
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
                                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap tabular-nums">
                                            {new Date(entry.createdAt).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-slate-200 font-medium">
                                            {entry.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-300 font-medium text-xs bg-white/5 px-2 py-1 rounded border border-white/10">
                                                {entry.referenceNumber}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums">
                                            {entry.entryType === 'debit' ? (
                                                <span className="text-white font-medium">
                                                    {formatCurrency(Number(entry.amount))}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums">
                                            {entry.entryType === 'credit' ? (
                                                <span className="text-white font-medium">
                                                    {formatCurrency(Number(entry.amount))}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
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
                    <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 bg-[#0a0a0a]/50">
                        <span>
                            Showing {showFrom} to {showTo} of {total} entries
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        className={`px-3 py-1.5 rounded border border-white/10 transition-colors ${
                                            pageNum === page
                                                ? 'bg-white/10 text-white font-medium'
                                                : 'hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
