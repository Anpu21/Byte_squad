import { LuPlus as Plus } from 'react-icons/lu';
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
                <p className="text-sm text-text-2">
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
