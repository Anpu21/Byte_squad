import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { accountingService } from '@/services/accounting.service';
import type { IBranchWithMeta, ICreateExpensePayload } from '@/types';

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

interface AddExpenseModalProps {
    isAdmin: boolean;
    defaultBranchId: string;
    branches: IBranchWithMeta[];
    onClose: () => void;
    onSaved: () => void;
}

export function AddExpenseModal({
    isAdmin,
    defaultBranchId,
    branches,
    onClose,
    onSaved,
}: AddExpenseModalProps) {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState<ICreateExpensePayload>({
        branchId: defaultBranchId || undefined,
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
        if (isAdmin && !form.branchId) {
            setError('Please pick a branch.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            // Managers don't need to send branchId; backend forces it from JWT.
            const payload: ICreateExpensePayload = isAdmin
                ? form
                : { ...form, branchId: undefined };
            await accountingService.createExpense(payload);
            onSaved();
        } catch {
            setError('Failed to save expense. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const fieldClass =
        'w-full h-[38px] px-3 bg-surface border border-border-strong rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors placeholder:text-text-3';

    return (
        <Modal isOpen onClose={onClose} title="Add expense" maxWidth="md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                    <div className="px-3 py-2 rounded-md bg-danger-soft border border-danger/40 text-xs text-danger font-medium">
                        {error}
                    </div>
                )}

                {isAdmin && (
                    <div>
                        <label className="block text-xs font-medium text-text-2 mb-1.5">
                            Branch
                        </label>
                        <select
                            value={form.branchId ?? ''}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    branchId: e.target.value || undefined,
                                })
                            }
                            className={fieldClass}
                        >
                            <option value="">Select branch</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        Category
                    </label>
                    <select
                        value={form.category}
                        onChange={(e) =>
                            setForm({ ...form, category: e.target.value })
                        }
                        className={fieldClass}
                    >
                        <option value="">Select category</option>
                        {EXPENSE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        Amount (LKR)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount || ''}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                amount: parseFloat(e.target.value) || 0,
                            })
                        }
                        placeholder="0.00"
                        className={`${fieldClass} mono`}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        Description
                    </label>
                    <input
                        type="text"
                        value={form.description}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                description: e.target.value,
                            })
                        }
                        placeholder="What was this expense for?"
                        className={fieldClass}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        Date
                    </label>
                    <input
                        type="date"
                        value={form.expenseDate}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                expenseDate: e.target.value,
                            })
                        }
                        className={fieldClass}
                    />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" size="md" disabled={saving}>
                        {saving ? 'Saving…' : 'Save expense'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
