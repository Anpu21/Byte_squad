import type { IInventoryMatrixBranchColumn } from '@/types';
import { FilterRadioList } from './FilterRadioList';

interface FilterBranchProps {
    branches: IInventoryMatrixBranchColumn[];
    selected: string;
    onChange: (value: string) => void;
}

export function FilterBranch({ branches, selected, onChange }: FilterBranchProps) {
    const options = [
        { value: '', label: 'All branches' },
        ...branches.map((b) => ({ value: b.id, label: b.name })),
    ];
    return (
        <FilterRadioList
            title="Branch"
            name="branch"
            options={options}
            selected={selected}
            onChange={onChange}
            scrollable
            emptyLabel="No branches yet"
        />
    );
}
