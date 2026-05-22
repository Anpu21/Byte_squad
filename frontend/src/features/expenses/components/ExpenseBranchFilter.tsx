import type { IBranchWithMeta } from '@/types';
import { ExpenseRadioRow } from './ExpenseRadioRow';

interface ExpenseBranchFilterProps {
    branches: IBranchWithMeta[];
    selected: string;
    onChange: (value: string) => void;
}

export function ExpenseBranchFilter({
    branches,
    selected,
    onChange,
}: ExpenseBranchFilterProps) {
    return (
        <div>
            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                Branch
            </p>
            <div className="flex flex-col gap-1">
                <ExpenseRadioRow
                    name="branch"
                    value=""
                    selected={selected === ''}
                    label="All branches"
                    onChange={onChange}
                />
                {branches.map((b) => (
                    <ExpenseRadioRow
                        key={b.id}
                        name="branch"
                        value={b.id}
                        selected={selected === b.id}
                        label={b.name}
                        onChange={onChange}
                    />
                ))}
                {branches.length === 0 && (
                    <p className="text-xs text-text-3 px-2 py-1">
                        No branches available
                    </p>
                )}
            </div>
        </div>
    );
}
