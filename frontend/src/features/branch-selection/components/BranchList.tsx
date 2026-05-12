import type { IShopBranch } from '@/types';
import { BranchOption } from './BranchOption';

interface BranchListProps {
    branches: IShopBranch[];
    isLoading: boolean;
    isError: boolean;
    selectedId: string | null;
    headOfficeId: string | null;
    onSelect: (id: string) => void;
}

export function BranchList({
    branches,
    isLoading,
    isError,
    selectedId,
    headOfficeId,
    onSelect,
}: BranchListProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (isError || branches.length === 0) {
        return (
            <div className="px-3 py-2 rounded-md bg-danger-soft border border-danger/40 text-xs text-danger font-medium mb-6">
                No active branches available. Please try again later.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 mb-7">
            {branches.map((branch) => (
                <BranchOption
                    key={branch.id}
                    branch={branch}
                    isSelected={selectedId === branch.id}
                    isHeadOffice={branch.id === headOfficeId}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}
