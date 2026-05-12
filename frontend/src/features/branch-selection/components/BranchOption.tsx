import type { IShopBranch } from '@/types';

interface BranchOptionProps {
    branch: IShopBranch;
    isSelected: boolean;
    isHeadOffice: boolean;
    onSelect: (id: string) => void;
}

export function BranchOption({
    branch,
    isSelected,
    isHeadOffice,
    onSelect,
}: BranchOptionProps) {
    const subtitle = isHeadOffice
        ? `Head office · ${branch.staffCount} staff`
        : `${branch.staffCount} staff`;

    return (
        <button
            type="button"
            onClick={() => onSelect(branch.id)}
            aria-pressed={isSelected}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-md border text-left transition-all ${
                isSelected
                    ? 'border-primary bg-primary-soft ring-[3px] ring-primary/20'
                    : 'border-border-strong hover:border-primary hover:bg-surface-2'
            }`}
        >
            <span
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                        ? 'border-primary bg-primary'
                        : 'border-border-strong'
                }`}
                aria-hidden="true"
            >
                {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-text-inv" />
                )}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-1 truncate">
                    {branch.name}
                </p>
                <p className="text-xs text-text-2 mt-0.5 truncate">{subtitle}</p>
            </div>
        </button>
    );
}
