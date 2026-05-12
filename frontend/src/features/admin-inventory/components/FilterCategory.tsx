import { FilterRadioList } from './FilterRadioList';

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
    const options = [
        { value: '', label: 'All' },
        ...categories.map((c) => ({ value: c, label: c })),
    ];
    return (
        <FilterRadioList
            title="Category"
            name="category"
            options={options}
            selected={selected}
            onChange={onChange}
            scrollable
            emptyLabel="No categories yet"
        />
    );
}
