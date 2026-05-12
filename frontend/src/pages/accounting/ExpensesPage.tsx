import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Trash2,
    X,
    Wallet,
    Search,
    Check,
    XCircle,
    Building2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useConfirm } from '@/hooks/useConfirm';
import { accountingService } from '@/services/accounting.service';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IExpense, IBranchWithMeta } from '@/types';
import { ExpenseStatus, UserRole } from '@/constants/enums';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import StatusPill from '@/components/ui/StatusPill';
import EmptyState from '@/components/ui/EmptyState';
import Spark from '@/components/ui/Spark';
import AddExpenseModal from './AddExpenseModal';
import ReviewExpenseModal from './ReviewExpenseModal';

type StatusFilter = 'all' | ExpenseStatus;

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: ExpenseStatus.PENDING, label: 'Pending' },
    { key: ExpenseStatus.APPROVED, label: 'Approved' },
    { key: ExpenseStatus.REJECTED, label: 'Rejected' },
];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(amount);
}

function monthLabel(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ExpensesPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const queryClient = useQueryClient();
    const confirm = useConfirm();

    const [showAddModal, setShowAddModal] = useState(false);

    const [filterCategory, setFilterCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
    const [selectedBranchId, setSelectedBranchId] = useState<string>(''); // '' = all branches (admin)
    const [error, setError] = useState<string | null>(null);

    const [reviewTarget, setReviewTarget] = useState<{
        expense: IExpense;
        action: 'approved' | 'rejected';
    } | null>(null);

    const expensesQueryKey = useMemo(
        () =>
            [
                'expenses',
                {
                    branchId:
                        isAdmin && selectedBranchId ? selectedBranchId : null,
                    status: selectedStatus !== 'all' ? selectedStatus : null,
                },
            ] as const,
        [isAdmin, selectedBranchId, selectedStatus],
    );

    const {
        data: expenses = [],
        isLoading,
        error: queryError,
    } = useQuery<IExpense[]>({
        queryKey: expensesQueryKey,
        queryFn: () =>
            accountingService.getExpenses({
                branchId:
                    isAdmin && selectedBranchId ? selectedBranchId : undefined,
                status:
                    selectedStatus !== 'all' ? selectedStatus : undefined,
            }),
    });

    const { data: branches = [] } = useQuery<IBranchWithMeta[]>({
        queryKey: queryKeys.admin.branches(),
        queryFn: adminService.listBranches,
        enabled: isAdmin,
    });

    const fetchError =
        error ?? (queryError ? 'Failed to load expenses' : null);

    const invalidateExpenses = () =>
        queryClient.invalidateQueries({ queryKey: ['expenses'] });

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return expenses.filter((e) => {
            if (filterCategory && e.category !== filterCategory) return false;
            if (
                q &&
                !e.description.toLowerCase().includes(q) &&
                !e.category.toLowerCase().includes(q)
            ) {
                return false;
            }
            return true;
        });
    }, [expenses, filterCategory, searchQuery]);

    const hasActiveFilter =
        filterCategory !== '' ||
        searchQuery !== '' ||
        selectedStatus !== 'all' ||
        (isAdmin && selectedBranchId !== '');

    const resetFilters = () => {
        setFilterCategory('');
        setSearchQuery('');
        setSelectedStatus('all');
        setSelectedBranchId('');
    };

    const now = new Date();

    const thisMonthExpenses = useMemo(() => {
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        return expenses.filter((e) => {
            const d = new Date(e.expenseDate);
            return d.getMonth() === month && d.getFullYear() === year;
        });
    }, [expenses]);

    const thisMonthTotal = useMemo(
        () =>
            thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
        [thisMonthExpenses],
    );

    const lastMonthTotal = useMemo(() => {
        const now = new Date();
        const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year =
            now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return expenses
            .filter((e) => {
                const d = new Date(e.expenseDate);
                return d.getMonth() === month && d.getFullYear() === year;
            })
            .reduce((sum, e) => sum + Number(e.amount), 0);
    }, [expenses]);

    const monthOverMonthDelta = useMemo(() => {
        if (lastMonthTotal === 0) return null;
        return ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    }, [thisMonthTotal, lastMonthTotal]);

    const largestCategory = useMemo(() => {
        const tally = new Map<string, number>();
        for (const e of thisMonthExpenses) {
            tally.set(
                e.category,
                (tally.get(e.category) ?? 0) + Number(e.amount),
            );
        }
        let topName = '';
        let topAmount = 0;
        for (const [name, amount] of tally) {
            if (amount > topAmount) {
                topName = name;
                topAmount = amount;
            }
        }
        return topName ? { name: topName, amount: topAmount } : null;
    }, [thisMonthExpenses]);

    const categories = useMemo(
        () => [...new Set(expenses.map((e) => e.category))].sort(),
        [expenses],
    );

    const last14DaysTotals = useMemo(() => {
        const buckets: number[] = new Array(14).fill(0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startMs = today.getTime() - 13 * 86400000;
        for (const e of expenses) {
            const d = new Date(e.expenseDate);
            d.setHours(0, 0, 0, 0);
            const diff = Math.floor((d.getTime() - startMs) / 86400000);
            if (diff >= 0 && diff < 14) {
                buckets[diff] += Number(e.amount);
            }
        }
        return buckets;
    }, [expenses]);

    const deltaIsGood =
        monthOverMonthDelta !== null && monthOverMonthDelta < 0;
    const deltaColor =
        monthOverMonthDelta === null
            ? 'var(--text-3)'
            : deltaIsGood
              ? 'var(--accent)'
              : 'var(--danger)';

    const pendingCount = useMemo(
        () => expenses.filter((e) => e.status === ExpenseStatus.PENDING).length,
        [expenses],
    );
    const approvedCount = useMemo(
        () =>
            expenses.filter((e) => e.status === ExpenseStatus.APPROVED).length,
        [expenses],
    );

    const showBranchOnRow = isAdmin && selectedBranchId === '';

    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: 'Delete expense?',
            body: 'This action cannot be undone.',
            confirmLabel: 'Delete expense',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await accountingService.deleteExpense(id);
            await invalidateExpenses();
        } catch {
            setError('Failed to delete expense');
        }
    };

    const handleReview = async (note: string) => {
        if (!reviewTarget) return;
        try {
            await accountingService.reviewExpense(reviewTarget.expense.id, {
                status:
                    reviewTarget.action === 'approved'
                        ? ExpenseStatus.APPROVED
                        : ExpenseStatus.REJECTED,
                note: note || undefined,
            });
            await invalidateExpenses();
            setReviewTarget(null);
        } catch {
            setError('Failed to update expense status');
        }
    };

    const branchById = useMemo(() => {
        const map = new Map<string, string>();
        for (const b of branches) map.set(b.id, b.name);
        return map;
    }, [branches]);

    const branchLabel = (id: string) =>
        branchById.get(id) ?? id.substring(0, 6);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5">
                        Accounting
                    </p>
                    <h1 className="text-3xl font-bold text-text-1 tracking-tight leading-none">
                        Expenses
                    </h1>
                    <p className="text-sm text-text-2 mt-1.5">
                        {monthLabel(now)}
                        {isAdmin && (
                            <>
                                {' '}
                                ·{' '}
                                <span className="text-text-3">
                                    {selectedBranchId
                                        ? branchLabel(selectedBranchId)
                                        : 'All branches'}
                                </span>
                            </>
                        )}
                    </p>
                </div>
                <Button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    disabled={!isAdmin && !user?.branchId}
                    size="md"
                >
                    <Plus size={14} /> Add expense
                </Button>
            </div>

            {fetchError && (
                <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
                    {fetchError}
                </div>
            )}

            {/* Two-column body: filter rail + content */}
            <div className="flex flex-col lg:flex-row gap-5">
                {/* Left rail */}
                <aside className="w-full lg:w-60 lg:flex-shrink-0">
                    <Card className="p-4">
                        {/* Search */}
                        <div>
                            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                                Search
                            </p>
                            <div className="relative">
                                <Search
                                    size={14}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Description or category"
                                    className="w-full h-9 pl-9 pr-3 bg-canvas border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/25 placeholder:text-text-3 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="border-t border-border pt-4 mt-4">
                            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                                Status
                            </p>
                            <div className="flex flex-col gap-1">
                                {STATUS_OPTIONS.map((opt) => {
                                    const selected = selectedStatus === opt.key;
                                    const count =
                                        opt.key === 'all'
                                            ? expenses.length
                                            : expenses.filter(
                                                  (e) => e.status === opt.key,
                                              ).length;
                                    return (
                                        <label
                                            key={opt.key}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-colors ${
                                                selected
                                                    ? 'bg-accent-soft text-accent-text'
                                                    : 'text-text-1 hover:bg-surface-2'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="status"
                                                value={opt.key}
                                                checked={selected}
                                                onChange={() =>
                                                    setSelectedStatus(opt.key)
                                                }
                                                style={{
                                                    accentColor:
                                                        'var(--accent)',
                                                }}
                                            />
                                            <span>{opt.label}</span>
                                            <span
                                                className={`ml-auto text-[11px] mono ${
                                                    selected
                                                        ? 'text-accent-text/70'
                                                        : 'text-text-3'
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Branch (admin only) */}
                        {isAdmin && (
                            <div className="border-t border-border pt-4 mt-4">
                                <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                                    Branch
                                </p>
                                <div className="flex flex-col gap-1">
                                    <label
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-colors ${
                                            selectedBranchId === ''
                                                ? 'bg-accent-soft text-accent-text'
                                                : 'text-text-1 hover:bg-surface-2'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="branch"
                                            value=""
                                            checked={selectedBranchId === ''}
                                            onChange={() =>
                                                setSelectedBranchId('')
                                            }
                                            style={{
                                                accentColor: 'var(--accent)',
                                            }}
                                        />
                                        <span>All branches</span>
                                    </label>
                                    {branches.map((b) => {
                                        const selected =
                                            selectedBranchId === b.id;
                                        return (
                                            <label
                                                key={b.id}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-colors ${
                                                    selected
                                                        ? 'bg-accent-soft text-accent-text'
                                                        : 'text-text-1 hover:bg-surface-2'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="branch"
                                                    value={b.id}
                                                    checked={selected}
                                                    onChange={() =>
                                                        setSelectedBranchId(b.id)
                                                    }
                                                    style={{
                                                        accentColor:
                                                            'var(--accent)',
                                                    }}
                                                />
                                                <span className="truncate">
                                                    {b.name}
                                                </span>
                                            </label>
                                        );
                                    })}
                                    {branches.length === 0 && (
                                        <p className="text-xs text-text-3 px-2 py-1">
                                            No branches available
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Category */}
                        <div className="border-t border-border pt-4 mt-4">
                            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                                Category
                            </p>
                            <div className="flex flex-col gap-1">
                                <label
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-colors ${
                                        filterCategory === ''
                                            ? 'bg-accent-soft text-accent-text'
                                            : 'text-text-1 hover:bg-surface-2'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="category"
                                        value=""
                                        checked={filterCategory === ''}
                                        onChange={() => setFilterCategory('')}
                                        style={{
                                            accentColor: 'var(--accent)',
                                        }}
                                    />
                                    <span>All</span>
                                    <span className="ml-auto text-[11px] text-text-3 mono">
                                        {expenses.length}
                                    </span>
                                </label>
                                {categories.map((c) => {
                                    const count = expenses.filter(
                                        (e) => e.category === c,
                                    ).length;
                                    const selected = filterCategory === c;
                                    return (
                                        <label
                                            key={c}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-colors ${
                                                selected
                                                    ? 'bg-accent-soft text-accent-text'
                                                    : 'text-text-1 hover:bg-surface-2'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="category"
                                                value={c}
                                                checked={selected}
                                                onChange={() =>
                                                    setFilterCategory(c)
                                                }
                                                style={{
                                                    accentColor:
                                                        'var(--accent)',
                                                }}
                                            />
                                            <span className="truncate">{c}</span>
                                            <span
                                                className={`ml-auto text-[11px] mono ${
                                                    selected
                                                        ? 'text-accent-text/70'
                                                        : 'text-text-3'
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        </label>
                                    );
                                })}
                                {categories.length === 0 && (
                                    <p className="text-xs text-text-3 px-2 py-1">
                                        No categories yet
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Reset all */}
                        <div className="border-t border-border pt-4 mt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={resetFilters}
                                disabled={!hasActiveFilter}
                            >
                                Reset all
                            </Button>
                        </div>
                    </Card>
                </aside>

                {/* Right content */}
                <div className="flex-1 min-w-0">
                    {/* Hero KPI panel */}
                    <Card className="p-6 border-l-2 border-l-accent mb-3">
                        <div className="flex items-end justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                                    Total · {monthLabel(now)}
                                </p>
                                <p className="mono text-4xl font-semibold text-text-1 tracking-tight leading-none">
                                    {formatCurrency(thisMonthTotal)}
                                </p>
                            </div>
                            <div className="flex items-end gap-3">
                                <div className="w-32">
                                    <Spark
                                        data={last14DaysTotals}
                                        color={deltaColor}
                                        h={36}
                                        fill
                                    />
                                    <p className="text-[10px] text-text-3 text-right mt-1 uppercase tracking-widest">
                                        Last 14 days
                                    </p>
                                </div>
                                {monthOverMonthDelta !== null && (
                                    <div
                                        className={`inline-flex items-center h-7 px-2.5 rounded-md text-xs font-semibold ${
                                            deltaIsGood
                                                ? 'bg-accent-soft text-accent-text'
                                                : 'bg-danger-soft text-danger'
                                        }`}
                                    >
                                        {monthOverMonthDelta > 0 ? '+' : ''}
                                        {monthOverMonthDelta.toFixed(1)}%
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Secondary metrics (compact line) */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-2 mb-5 px-1">
                        <span>
                            <span className="text-text-1 font-medium mono">
                                {expenses.length}
                            </span>{' '}
                            entries
                        </span>
                        <span className="text-text-3">·</span>
                        <span className="text-warning">
                            <span className="font-medium mono">
                                {pendingCount}
                            </span>{' '}
                            pending
                        </span>
                        <span className="text-text-3">·</span>
                        <span className="text-accent-text">
                            <span className="font-medium mono">
                                {approvedCount}
                            </span>{' '}
                            approved
                        </span>
                        {largestCategory && (
                            <>
                                <span className="text-text-3">·</span>
                                <span>
                                    Top:{' '}
                                    <span className="text-text-1 font-medium">
                                        {largestCategory.name}
                                    </span>{' '}
                                    <span className="text-text-1 font-medium mono">
                                        {formatCurrency(largestCategory.amount)}
                                    </span>
                                </span>
                            </>
                        )}
                    </div>

                    {/* Active filters chip bar */}
                    {hasActiveFilter && (
                        <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-accent-soft text-accent-text text-xs font-medium hover:opacity-80 transition-opacity"
                                >
                                    <Search size={11} />
                                    <span>&ldquo;{searchQuery}&rdquo;</span>
                                    <X size={12} className="opacity-70" />
                                </button>
                            )}
                            {selectedStatus !== 'all' && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedStatus('all')}
                                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-accent-soft text-accent-text text-xs font-medium hover:opacity-80 transition-opacity capitalize"
                                >
                                    <span>{selectedStatus}</span>
                                    <X size={12} className="opacity-70" />
                                </button>
                            )}
                            {isAdmin && selectedBranchId && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedBranchId('')}
                                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-accent-soft text-accent-text text-xs font-medium hover:opacity-80 transition-opacity"
                                >
                                    <Building2 size={11} />
                                    <span>{branchLabel(selectedBranchId)}</span>
                                    <X size={12} className="opacity-70" />
                                </button>
                            )}
                            {filterCategory && (
                                <button
                                    type="button"
                                    onClick={() => setFilterCategory('')}
                                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-accent-soft text-accent-text text-xs font-medium hover:opacity-80 transition-opacity"
                                >
                                    <span>{filterCategory}</span>
                                    <X size={12} className="opacity-70" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="text-xs text-text-3 hover:text-text-1 underline-offset-4 hover:underline transition-colors"
                            >
                                Reset all
                            </button>
                            <span className="ml-auto text-xs text-text-3">
                                {filtered.length} of {expenses.length}
                            </span>
                        </div>
                    )}

                    {/* List */}
                    {isLoading ? (
                        <ul className="flex flex-col gap-2">
                            {[...Array(5)].map((_, i) => (
                                <li
                                    key={i}
                                    className="h-14 bg-surface-2 rounded-md animate-pulse"
                                />
                            ))}
                        </ul>
                    ) : filtered.length === 0 ? (
                        <Card>
                            <EmptyState
                                icon={<Wallet size={20} />}
                                title="No expenses recorded"
                                description={
                                    hasActiveFilter
                                        ? 'No expenses match the current filters.'
                                        : 'Start tracking your spending by adding your first expense.'
                                }
                                action={
                                    !hasActiveFilter ? (
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                setShowAddModal(true)
                                            }
                                            disabled={
                                                !isAdmin && !user?.branchId
                                            }
                                            size="md"
                                        >
                                            <Plus size={14} /> Add expense
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={resetFilters}
                                            size="md"
                                        >
                                            Reset filters
                                        </Button>
                                    )
                                }
                            />
                        </Card>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {filtered.map((expense) => {
                                const date = new Date(expense.expenseDate);
                                const day = date.toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                });
                                const mon = date.toLocaleDateString('en-GB', {
                                    month: 'short',
                                });
                                const isPending =
                                    expense.status === ExpenseStatus.PENDING;
                                const branchName =
                                    expense.branch?.name ??
                                    branchLabel(expense.branchId);
                                return (
                                    <li key={expense.id}>
                                        <Card className="group p-4 hover:border-border-strong hover:bg-surface-2 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-center w-12 flex-shrink-0">
                                                    <span className="mono text-lg font-semibold text-text-1 leading-none">
                                                        {day}
                                                    </span>
                                                    <span className="text-[11px] uppercase tracking-widest text-text-3 mt-1">
                                                        {mon}
                                                    </span>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <Pill
                                                        tone="neutral"
                                                        dot={false}
                                                    >
                                                        {expense.category}
                                                    </Pill>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <StatusPill
                                                        status={expense.status}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-text-1 truncate">
                                                        {expense.description}
                                                    </p>
                                                    {showBranchOnRow && (
                                                        <p className="text-[11px] text-text-3 mt-0.5 inline-flex items-center gap-1">
                                                            <Building2
                                                                size={10}
                                                            />
                                                            {branchName}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="mono text-base font-semibold text-text-1 whitespace-nowrap">
                                                    {formatCurrency(
                                                        Number(expense.amount),
                                                    )}
                                                </p>

                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {isAdmin && isPending && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setReviewTarget(
                                                                        {
                                                                            expense,
                                                                            action: 'approved',
                                                                        },
                                                                    )
                                                                }
                                                                className="p-1.5 text-text-3 hover:text-accent-text opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all rounded-md hover:bg-accent-soft"
                                                                title="Approve"
                                                                aria-label="Approve"
                                                            >
                                                                <Check
                                                                    size={14}
                                                                />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setReviewTarget(
                                                                        {
                                                                            expense,
                                                                            action: 'rejected',
                                                                        },
                                                                    )
                                                                }
                                                                className="p-1.5 text-text-3 hover:text-danger opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all rounded-md hover:bg-danger-soft"
                                                                title="Reject"
                                                                aria-label="Reject"
                                                            >
                                                                <XCircle
                                                                    size={14}
                                                                />
                                                            </button>
                                                        </>
                                                    )}
                                                    {(isAdmin ||
                                                        (isPending &&
                                                            expense.branchId ===
                                                                user?.branchId)) && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(expense.id)
                                                            }
                                                            className="p-1.5 text-text-3 hover:text-danger opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all rounded-md hover:bg-danger-soft"
                                                            title="Delete"
                                                            aria-label="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {expense.reviewNote && (
                                                <p className="mt-2 ml-16 text-[12px] text-text-3 italic">
                                                    Note: {expense.reviewNote}
                                                </p>
                                            )}
                                        </Card>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {showAddModal && (
                <AddExpenseModal
                    isAdmin={isAdmin}
                    defaultBranchId={user?.branchId ?? ''}
                    branches={branches}
                    onClose={() => setShowAddModal(false)}
                    onSaved={() => {
                        setShowAddModal(false);
                        void invalidateExpenses();
                    }}
                />
            )}

            {reviewTarget && (
                <ReviewExpenseModal
                    expense={reviewTarget.expense}
                    action={reviewTarget.action}
                    onCancel={() => setReviewTarget(null)}
                    onConfirm={handleReview}
                />
            )}
        </div>
    );
}

