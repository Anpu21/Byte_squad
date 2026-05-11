import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import StatusPill from '@/components/ui/StatusPill';
import type {
    IInventoryMatrixBranchColumn,
    IInventoryMatrixCell,
    IInventoryMatrixRow,
} from '@/types';
import BranchQuantityChip from './BranchQuantityChip';

interface ProductInventoryCardProps {
    row: IInventoryMatrixRow;
    branches: IInventoryMatrixBranchColumn[];
    onCellClick: (
        row: IInventoryMatrixRow,
        cell: IInventoryMatrixCell,
    ) => void;
}

interface DecoratedCell {
    cell: IInventoryMatrixCell;
    branch: IInventoryMatrixBranchColumn;
    branchIndex: number;
    statusRank: number;
}

const RANK_OUT = 0;
const RANK_LOW = 1;
const RANK_HEALTHY = 2;
const RANK_NORECORD = 3;

function rankFor(cell: IInventoryMatrixCell): number {
    if (cell.inventoryId === null) return RANK_NORECORD;
    if (cell.isOutOfStock) return RANK_OUT;
    if (cell.isLowStock) return RANK_LOW;
    return RANK_HEALTHY;
}

interface WorstStatus {
    status: string;
    label: string;
}

// Worst status across the row drives the card's top-right StatusPill.
function deriveWorstStatus(cells: IInventoryMatrixCell[]): WorstStatus {
    let hasOut = false;
    let hasLow = false;
    let hasReal = false;
    for (const c of cells) {
        if (c.inventoryId === null) continue;
        hasReal = true;
        if (c.isOutOfStock) hasOut = true;
        else if (c.isLowStock) hasLow = true;
    }
    if (hasOut) return { status: 'out_of_stock', label: 'Out' };
    if (hasLow) return { status: 'low', label: 'Low' };
    if (!hasReal) return { status: 'invited', label: 'No record' };
    return { status: 'in_stock', label: 'Healthy' };
}

export default function ProductInventoryCard({
    row,
    branches,
    onCellClick,
}: ProductInventoryCardProps) {
    const navigate = useNavigate();

    const sortedCells = useMemo<DecoratedCell[]>(() => {
        const branchById = new Map(
            branches.map((b, idx) => [b.id, { branch: b, idx }] as const),
        );
        const decorated: DecoratedCell[] = [];
        for (const cell of row.cells) {
            const meta = branchById.get(cell.branchId);
            if (!meta) continue;
            decorated.push({
                cell,
                branch: meta.branch,
                branchIndex: meta.idx,
                statusRank: rankFor(cell),
            });
        }
        decorated.sort((a, b) => {
            if (a.statusRank !== b.statusRank)
                return a.statusRank - b.statusRank;
            return a.branchIndex - b.branchIndex;
        });
        return decorated;
    }, [row.cells, branches]);

    const worst = useMemo(() => deriveWorstStatus(row.cells), [row.cells]);

    return (
        <div className="bg-surface border border-border rounded-md shadow-xs">
            <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                FRONTEND_ROUTES.INVENTORY_EDIT.replace(
                                    ':productId',
                                    row.productId,
                                ),
                            )
                        }
                        className="text-left text-text-1 font-semibold text-[14px] hover:underline focus:outline-none focus:ring-[3px] focus:ring-primary/25 rounded"
                    >
                        {row.productName}
                    </button>
                    <p className="text-[11px] text-text-3 mt-0.5">
                        {row.barcode} · {row.category}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">
                        Total
                    </span>
                    <span className="text-text-1 font-bold tabular-nums text-[14px]">
                        {row.totalQuantity}
                    </span>
                    <StatusPill status={worst.status} label={worst.label} />
                </div>
            </div>
            <div className="border-t border-border px-4 py-3 flex items-center gap-2 flex-wrap">
                {sortedCells.map(({ cell, branch }) => (
                    <BranchQuantityChip
                        key={cell.branchId}
                        branch={branch}
                        cell={cell}
                        onClick={() => onCellClick(row, cell)}
                    />
                ))}
            </div>
        </div>
    );
}
