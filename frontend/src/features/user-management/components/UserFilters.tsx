import { Search } from 'lucide-react';
import Card from '@/components/ui/Card';
import { UserRole } from '@/constants/enums';
import type { IBranch } from '@/types';

const SELECT_CLASS =
    'h-9 bg-canvas border border-border text-text-1 text-sm rounded-md px-3 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/25 cursor-pointer transition-colors';

interface UserFiltersProps {
    branches: IBranch[];
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    roleFilter: string;
    setRoleFilter: (v: string) => void;
    branchFilter: string;
    setBranchFilter: (v: string) => void;
}

export function UserFilters({
    branches,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    branchFilter,
    setBranchFilter,
}: UserFiltersProps) {
    return (
        <Card className="mb-4">
            <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative w-full sm:max-w-xs">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                        size={14}
                    />
                    <label htmlFor="user-search" className="sr-only">
                        Search users
                    </label>
                    <input
                        id="user-search"
                        type="text"
                        placeholder="Search name or email…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 bg-canvas border border-border rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/25 placeholder:text-text-3 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        aria-label="Role filter"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className={SELECT_CLASS}
                    >
                        <option value="all">All roles</option>
                        <option value={UserRole.ADMIN}>Admin</option>
                        <option value={UserRole.MANAGER}>Manager</option>
                        <option value={UserRole.CASHIER}>Cashier</option>
                    </select>
                    <select
                        aria-label="Branch filter"
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className={SELECT_CLASS}
                    >
                        <option value="all">All branches</option>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </Card>
    );
}
