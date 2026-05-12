import type { IExpense } from '@/types';
import { ExpenseStatus } from '@/constants/enums';
import type { StatusFilter } from '../types/status-filter.type';
import { ExpenseRadioRow } from './ExpenseRadioRow';

interface ExpenseStatusFilterProps {
    expenses: IExpense[];
    selected: StatusFilter;
    onChange: (value: StatusFilter) => void;
}

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: ExpenseStatus.PENDING, label: 'Pending' },
    { key: ExpenseStatus.APPROVED, label: 'Approved' },
    { key: ExpenseStatus.REJECTED, label: 'Rejected' },
];

export function ExpenseStatusFilter({
    expenses,
    selected,
    onChange,
}: ExpenseStatusFilterProps) {
    return (
        <div>
            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                Status
            </p>
            <div className="flex flex-col gap-1">
                {STATUS_OPTIONS.map((opt) => {
                    const count =
                        opt.key === 'all'
                            ? expenses.length
                            : expenses.filter((e) => e.status === opt.key).length;
                    return (
                        <ExpenseRadioRow
                            key={opt.key}
                            name="status"
                            value={opt.key}
                            selected={selected === opt.key}
                            label={opt.label}
                            count={count}
                            onChange={(v) => onChange(v as StatusFilter)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
