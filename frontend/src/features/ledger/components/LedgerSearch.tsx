import { Search } from 'lucide-react';
import type { IBranch } from '@/types';

const SELECT_CLASS =
    'h-9 px-3 bg-surface border border-border-strong text-text-1 text-sm rounded-md outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors';

interface LedgerSearchProps {
    branches: IBranch[];
    search: string;
    branchId: string;
    onSearchChange: (value: string) => void;
    onBranchChange: (value: string) => void;
}

export function LedgerSearch({
    branches,
    search,
    branchId,
    onSearchChange,
    onBranchChange,
}: LedgerSearchProps) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
            <div className="relative w-full min-w-0">
                <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                />
                <label htmlFor="ledger-search" className="sr-only">
                    Search ledger
                </label>
                <input
                    id="ledger-search"
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search description or reference…"
                    className="w-full h-9 pl-9 pr-3 bg-surface border border-border-strong rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 placeholder:text-text-3 transition-colors"
                />
            </div>
            <select
                aria-label="Branch filter"
                value={branchId}
                onChange={(e) => onBranchChange(e.target.value)}
                className={`${SELECT_CLASS} w-full`}
            >
                <option value="">All branches</option>
                {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                        {branch.name}
                    </option>
                ))}
            </select>
        </div>
    );
}