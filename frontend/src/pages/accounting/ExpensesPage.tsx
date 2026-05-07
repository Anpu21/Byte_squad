import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { accountingService } from '@/services/accounting.service';
import type { IExpense, ICreateExpensePayload } from '@/services/accounting.service';

const EXPENSE_CATEGORIES = [
    'Rent',
    'Utilities',
    'Salaries',
    'Supplies',
    'Marketing',
    'Insurance',
    'Maintenance',
    'Transportation',
    'Miscellaneous',
];

export default function ExpensesPage() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<IExpense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState('');

    const fetchExpenses = useCallback(() => {
        setIsLoading(true);
        setError(null);
        accountingService
            .getExpenses()
            .then(setExpenses)
            .catch(() => setError('Failed to load expenses'))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await accountingService.getExpenses();
                setExpenses(data);
                setError(null);
            } catch {
                setError('Failed to load expenses');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const filtered = useMemo(
        () => filterCategory ? expenses.filter((e) => e.category === filterCategory) : expenses,
        [expenses, filterCategory],
    );

    // Stats
    const thisMonthTotal = useMemo(() => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        return expenses
            .filter((e) => {
                const d = new Date(e.expenseDate);
                return d.getMonth() === month && d.getFullYear() === year;
            })
            .reduce((sum, e) => sum + Number(e.amount), 0);
    }, [expenses]);

    const categories = useMemo(
        () => [...new Set(expenses.map((e) => e.category))].sort(),
        [expenses],
    );

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await accountingService.deleteExpense(deleteId);
            setExpenses((prev) => prev.filter((e) => e.id !== deleteId));
        } catch {
            setError('Failed to delete expense');
        }
        setDeleteId(null);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">Expenses</h1>
                    <p className="text-sm text-text-2 mt-1">Track and manage your company outgoings</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="h-9 px-4 rounded-lg bg-primary text-text-inv text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Expense
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-danger-soft border border-danger/30 rounded-xl text-sm text-danger">
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="bg-surface border border-border rounded-md p-5">
                    <p className="text-[13px] font-medium text-text-2 mb-1">This Month</p>
                    <p className="text-2xl font-bold text-text-1 tracking-tight tabular-nums">{formatCurrency(thisMonthTotal)}</p>
                </div>
                <div className="bg-surface border border-border rounded-md p-5">
                    <p className="text-[13px] font-medium text-text-2 mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-text-1 tracking-tight tabular-nums">{expenses.length}</p>
                </div>
                <div className="bg-surface border border-border rounded-md p-5">
                    <p className="text-[13px] font-medium text-text-2 mb-1">Categories</p>
                    <p className="text-2xl font-bold text-text-1 tracking-tight">{categories.length}</p>
                </div>
            </div>

            {/* Filter */}
            <div className="mb-4 flex items-center gap-3">
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="h-9 px-3 bg-canvas border border-border text-text-1 text-sm rounded-lg outline-none focus:border-primary/40"
                >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <span className="text-xs text-text-3">
                    Showing {filtered.length} of {expenses.length}
                </span>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="bg-surface border border-border rounded-md overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="px-6 py-4 flex items-center gap-4 border-b border-border last:border-0">
                            <div className="h-4 w-24 bg-surface-2 rounded animate-pulse" />
                            <div className="h-4 w-32 bg-surface-2 rounded animate-pulse" />
                            <div className="flex-1" />
                            <div className="h-4 w-20 bg-surface-2 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-surface border border-border rounded-md shadow-2xl flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                    <div className="w-16 h-16 bg-surface-2 border border-border rounded-md flex items-center justify-center mb-6">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-text-1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-text-1 mb-2">No expenses recorded</h3>
                    <p className="text-sm text-text-2 max-w-[280px] mb-6">
                        {filterCategory
                            ? `No expenses in "${filterCategory}" category.`
                            : 'Start tracking your spending by adding your first expense.'}
                    </p>
                    {!filterCategory && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="h-9 px-5 rounded-lg bg-surface-2 border border-border text-text-1 text-sm font-medium hover:bg-primary-soft transition-colors"
                        >
                            Add Expense
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-surface border border-border rounded-md shadow-2xl overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_1fr_auto_1fr_auto] gap-4 px-6 py-3 border-b border-border bg-surface-2">
                        <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">Date</span>
                        <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">Category</span>
                        <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider text-right">Amount</span>
                        <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">Description</span>
                        <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider text-right">Actions</span>
                    </div>
                    {filtered.map((expense) => (
                        <div
                            key={expense.id}
                            className="grid grid-cols-[1fr_1fr_auto_1fr_auto] gap-4 px-6 py-3.5 border-b border-border last:border-0 hover:bg-surface-2 transition-colors group"
                        >
                            <span className="text-sm text-text-1 tabular-nums">
                                {new Date(expense.expenseDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </span>
                            <span className="text-sm text-text-1">
                                <span className="inline-flex items-center px-2 py-0.5 bg-surface-2 border border-border rounded-md text-xs font-medium">
                                    {expense.category}
                                </span>
                            </span>
                            <span className="text-sm font-semibold text-text-1 tabular-nums text-right min-w-[100px]">
                                {formatCurrency(Number(expense.amount))}
                            </span>
                            <span className="text-sm text-text-2 truncate">{expense.description}</span>
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={() => setDeleteId(expense.id)}
                                    className="p-1.5 text-text-3 hover:text-danger opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-danger-soft"
                                    title="Delete"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Expense Modal */}
            {showAddModal && user && (
                <AddExpenseModal
                    branchId={user.branchId}
                    onClose={() => setShowAddModal(false)}
                    onSaved={() => {
                        setShowAddModal(false);
                        fetchExpenses();
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-border rounded-md shadow-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-text-1 mb-2">Delete Expense</h3>
                        <p className="text-sm text-text-2 mb-6">
                            Are you sure you want to delete this expense? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="h-9 px-4 rounded-lg bg-surface-2 border border-border text-sm text-text-1 font-medium hover:bg-primary-soft transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="h-9 px-4 rounded-lg bg-danger-soft border border-danger/40 text-sm text-danger font-bold hover:bg-danger-soft transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AddExpenseModal({
    branchId,
    onClose,
    onSaved,
}: {
    branchId: string;
    onClose: () => void;
    onSaved: () => void;
}) {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState<ICreateExpensePayload>({
        branchId,
        category: '',
        amount: 0,
        description: '',
        expenseDate: today,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.category || !form.description || form.amount <= 0) {
            setError('Please fill all required fields with valid values.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await accountingService.createExpense(form);
            onSaved();
        } catch {
            setError('Failed to save expense. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-md shadow-2xl w-full max-w-md">
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold text-text-1">Add Expense</h2>
                    <button onClick={onClose} className="p-1.5 text-text-2 hover:text-text-1 rounded-lg hover:bg-surface-2 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="p-3 bg-danger-soft border border-danger/30 rounded-lg text-sm text-danger">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5">
                            Category *
                        </label>
                        <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="w-full h-10 px-3 bg-canvas border border-border text-text-1 text-sm rounded-lg outline-none focus:border-primary/40"
                        >
                            <option value="">Select category</option>
                            {EXPENSE_CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5">
                            Amount (LKR) *
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.amount || ''}
                            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            className="w-full h-10 px-3 bg-canvas border border-border text-text-1 text-sm rounded-lg outline-none focus:border-primary/40 tabular-nums"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5">
                            Description *
                        </label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="What was this expense for?"
                            className="w-full h-10 px-3 bg-canvas border border-border text-text-1 text-sm rounded-lg outline-none focus:border-primary/40"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5">
                            Date *
                        </label>
                        <input
                            type="date"
                            value={form.expenseDate}
                            onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                            className="w-full h-10 px-3 bg-canvas border border-border text-text-1 text-sm rounded-lg outline-none focus:border-primary/40"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-4 rounded-lg bg-surface-2 border border-border text-sm text-text-1 font-medium hover:bg-primary-soft transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-9 px-5 rounded-lg bg-primary text-text-inv text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
