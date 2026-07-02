import { LuSearch as Search } from 'react-icons/lu';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface BranchOption {
    id: string;
    name: string;
}

interface ReturnsFiltersProps {
    searchInput: string;
    setSearch: (value: string) => void;
    startDate: string;
    setStartDate: (value: string) => void;
    endDate: string;
    setEndDate: (value: string) => void;
    isAdmin: boolean;
    branches: BranchOption[];
    branchId: string;
    setBranchId: (value: string) => void;
}

export function ReturnsFilters({
    searchInput,
    setSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isAdmin,
    branches,
    branchId,
    setBranchId,
}: ReturnsFiltersProps) {
    return (
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="lg:w-64">
                <label className="block text-xs font-medium text-text-2 mb-1.5">
                    Search
                </label>
                <Input
                    aria-label="Search returns by invoice"
                    placeholder="Invoice number…"
                    value={searchInput}
                    onChange={(e) => setSearch(e.target.value)}
                    leftIcon={<Search size={15} />}
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-text-2 mb-1.5">
                    From
                </label>
                <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-auto"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-text-2 mb-1.5">
                    To
                </label>
                <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-auto"
                />
            </div>
            {isAdmin && (
                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        Branch
                    </label>
                    <Select
                        value={branchId}
                        onChange={setBranchId}
                        aria-label="Filter by branch"
                        options={[
                            { label: 'All branches', value: '' },
                            ...branches.map((b) => ({
                                label: b.name,
                                value: b.id,
                            })),
                        ]}
                    />
                </div>
            )}
        </div>
    );
}
