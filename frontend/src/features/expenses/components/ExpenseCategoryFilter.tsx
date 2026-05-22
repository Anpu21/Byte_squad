import type { IExpense } from '@/types';
import { ExpenseRadioRow } from './ExpenseRadioRow';

interface ExpenseCategoryFilterProps {
    expenses: IExpense[];
    categories: string[];
    selected: string;
    onChange: (value: string) => void;
}

export function ExpenseCategoryFilter({
    expenses,
    categories,
    selected,
    onChange,
}: ExpenseCategoryFilterProps) {
    return (
        <div>
            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                Category
            </p>
            <div className="flex flex-col gap-1">
                <ExpenseRadioRow
                    name="category"
                    value=""
                    selected={selected === ''}
                    label="All"
                    count={expenses.length}
                    onChange={onChange}
                />
                {categories.map((c) => (
                    <ExpenseRadioRow
                        key={c}
                        name="category"
                        value={c}
                        selected={selected === c}
                        label={c}
                        count={expenses.filter((e) => e.category === c).length}
                        onChange={onChange}
                    />
                ))}
                {categories.length === 0 && (
                    <p className="text-xs text-text-3 px-2 py-1">
                        No categories yet
                    </p>
                )}
            </div>
        </div>
    );
}
