import { useMemo } from 'react';
import KpiCard from '@/components/ui/KpiCard';
import type { IInventoryMatrixResponse } from '@/types';

interface InventoryKpiStripProps {
    matrix: IInventoryMatrixResponse | null;
}

// Per-page KPI counts. The matrix endpoint paginates rows, so these counts
// reflect the visible page only — full-catalog aggregates would require a
// `summary` block in the API response (deferred to a follow-up PR).
export default function InventoryKpiStrip({ matrix }: InventoryKpiStripProps) {
    const stats = useMemo(() => {
        if (!matrix)
            return { outOfStock: 0, lowStock: 0, healthy: 0, visible: 0 };
        let outOfStock = 0;
        let lowStock = 0;
        let healthy = 0;
        for (const row of matrix.rows) {
            const hasOut = row.cells.some(
                (c) => c.isOutOfStock && c.inventoryId !== null,
            );
            const hasLow = row.cells.some((c) => c.isLowStock);
            if (hasOut) outOfStock++;
            else if (hasLow) lowStock++;
            else healthy++;
        }
        return {
            outOfStock,
            lowStock,
            healthy,
            visible: matrix.rows.length,
        };
    }, [matrix]);

    const total = matrix?.total ?? 0;
    const branchCount = matrix?.branches.length ?? 0;
    const visibleSuffix =
        stats.visible > 0 ? `of ${stats.visible} on page` : '—';

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <KpiCard
                label="Out of stock"
                value={stats.outOfStock}
                delta={visibleSuffix}
                deltaPositive={stats.outOfStock === 0}
            />
            <KpiCard
                label="Low stock"
                value={stats.lowStock}
                delta={visibleSuffix}
                deltaPositive={stats.lowStock === 0}
            />
            <KpiCard
                label="Healthy"
                value={stats.healthy}
                delta={visibleSuffix}
                deltaPositive
            />
            <KpiCard
                label="Total products"
                value={total}
                delta={`${branchCount} ${branchCount === 1 ? 'branch' : 'branches'}`}
            />
        </div>
    );
}
