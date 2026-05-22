import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { monthLabel } from '../lib/format';

interface ExpensesHeaderProps {
    isAdmin: boolean;
    canAdd: boolean;
    selectedBranchLabel: string | null;
    onAdd: () => void;
}

export function ExpensesHeader({
    isAdmin,
    canAdd,
    selectedBranchLabel,
    onAdd,
}: ExpensesHeaderProps) {
    const now = new Date();
    return (
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
                                {selectedBranchLabel ?? 'All branches'}
                            </span>
                        </>
                    )}
                </p>
            </div>
            <Button type="button" onClick={onAdd} disabled={!canAdd} size="md">
                <Plus size={14} /> Add expense
            </Button>
        </div>
    );
}
