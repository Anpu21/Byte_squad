import type {
    IInventoryMatrixBranchColumn,
    IInventoryMatrixCell,
} from '@/types';
import { cn } from '@/lib/utils';

type ChipTone = 'danger' | 'warning' | 'healthy' | 'noRecord' | 'neutral';

interface BranchQuantityChipProps {
    branch: IInventoryMatrixBranchColumn;
    cell: IInventoryMatrixCell;
    onClick: () => void;
}

const CHIP_STYLE: Record<ChipTone, string> = {
    danger: 'bg-danger-soft text-danger border-transparent',
    warning: 'bg-warning-soft text-warning border-transparent',
    healthy: 'bg-surface-2 text-text-1 border-transparent',
    noRecord: 'bg-transparent text-text-3 border-border-strong border-dashed',
    neutral: 'bg-surface-2 text-text-3 border-transparent',
};

const DOT_STYLE: Record<ChipTone, string> = {
    danger: 'bg-danger',
    warning: 'bg-warning',
    healthy: 'bg-accent',
    noRecord: 'bg-text-3',
    neutral: 'bg-text-3',
};

function deriveTone(
    branch: IInventoryMatrixBranchColumn,
    cell: IInventoryMatrixCell,
): ChipTone {
    if (!branch.isActive) return 'neutral';
    if (cell.inventoryId === null) return 'noRecord';
    if (cell.isOutOfStock) return 'danger';
    if (cell.isLowStock) return 'warning';
    return 'healthy';
}

export default function BranchQuantityChip({
    branch,
    cell,
    onClick,
}: BranchQuantityChipProps) {
    const tone = deriveTone(branch, cell);
    const noRecord = cell.inventoryId === null;
    const inactiveSuffix = !branch.isActive ? ' (inactive)' : '';
    const ariaLabel = `${branch.name}${inactiveSuffix}: ${noRecord ? 'no record' : `${cell.quantity} units`}`;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className={cn(
                'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[12px] font-medium transition-colors hover:opacity-80 focus:outline-none focus:ring-[3px] focus:ring-primary/25',
                CHIP_STYLE[tone],
            )}
        >
            <span
                className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                    DOT_STYLE[tone],
                )}
                aria-hidden="true"
            />
            <span className="truncate">
                {branch.name}
                {inactiveSuffix}
            </span>
            <span className="tabular-nums font-semibold opacity-90">
                {noRecord ? '—' : cell.quantity}
            </span>
        </button>
    );
}
