import { useMemo } from 'react';
import Pill, { type PillTone } from '@/components/ui/Pill';
import type { IInventoryMatrixResponse } from '@/types';

interface BranchHealthRowProps {
    matrix: IInventoryMatrixResponse | null;
}

interface BranchHealth {
    id: string;
    name: string;
    isActive: boolean;
    outCount: number;
    lowCount: number;
}

// Per-branch health derived from the visible page. Like the KPI strip,
// counts reflect the current page until a backend summary is added.
export default function BranchHealthRow({ matrix }: BranchHealthRowProps) {
    const branchHealth: BranchHealth[] = useMemo(() => {
        if (!matrix) return [];
        return matrix.branches.map((b) => {
            let outCount = 0;
            let lowCount = 0;
            for (const row of matrix.rows) {
                const cell = row.cells.find((c) => c.branchId === b.id);
                if (!cell) continue;
                if (cell.isOutOfStock && cell.inventoryId !== null) outCount++;
                else if (cell.isLowStock) lowCount++;
            }
            return {
                id: b.id,
                name: b.name,
                isActive: b.isActive,
                outCount,
                lowCount,
            };
        });
    }, [matrix]);

    if (branchHealth.length === 0) return null;

    return (
        <div className="mb-5 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mr-1">
                Branches
            </span>
            {branchHealth.map((b) => {
                const tone: PillTone = !b.isActive
                    ? 'neutral'
                    : b.outCount > 0
                      ? 'danger'
                      : b.lowCount > 0
                        ? 'warning'
                        : 'success';
                const suffix = !b.isActive
                    ? ' (inactive)'
                    : b.outCount > 0
                      ? ` (${b.outCount} out)`
                      : b.lowCount > 0
                        ? ` (${b.lowCount} low)`
                        : '';
                return (
                    <Pill key={b.id} tone={tone}>
                        {b.name}
                        {suffix}
                    </Pill>
                );
            })}
        </div>
    );
}
