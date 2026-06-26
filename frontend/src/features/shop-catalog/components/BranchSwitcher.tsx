import { LuStore as Store } from 'react-icons/lu';
import { Select } from '@/components/ui/Select';
import type { IShopBranch } from '@/types';

interface BranchSwitcherProps {
    branches: IShopBranch[];
    activeBranchId: string | null;
    onChange: (branchId: string) => void;
}

/**
 * Lets a customer pick which branch's catalogue to browse. Switching does NOT
 * clear the cart — items keep the branch they were added from, so a single
 * cart can span multiple branches.
 */
export function BranchSwitcher({
    branches,
    activeBranchId,
    onChange,
}: BranchSwitcherProps) {
    if (branches.length === 0) return null;
    return (
        <label className="inline-flex items-center gap-2 text-xs text-text-2">
            <Store size={14} className="text-text-3" aria-hidden="true" />
            <span className="hidden sm:inline">Shopping at</span>
            <Select
                aria-label="Choose which branch to shop"
                value={activeBranchId ?? ''}
                onChange={onChange}
                options={branches.map((b) => ({ label: b.name, value: b.id }))}
            />
        </label>
    );
}
