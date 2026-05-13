import { FilterRadioRow } from './FilterRadioRow';

interface FilterCategoryProps {
    categories: string[];
    selected: string;
    onChange: (value: string) => void;
}

export function FilterCategory({
    categories,
    selected,
    onChange,
}: FilterCategoryProps) {
    return (
        <div>
            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                Category
            </p>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                <FilterRadioRow
                    name="category"
                    value=""
                    selected={selected === ''}
                    label="All"
                    onChange={onChange}
                />
                {categories.map((c) => (
                    <FilterRadioRow
                        key={c}
                        name="category"
                        value={c}
                        selected={selected === c}
                        label={c}
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
