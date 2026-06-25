import Card from '@/components/ui/Card';
import { EmptyState } from '@/components/ui';
import type { IInventorySummary } from '@/types';
import { formatRevenue } from '../lib/format';

interface InventorySummaryCardProps {
    inventory: IInventorySummary | undefined;
}

export function InventorySummaryCard({ inventory }: InventorySummaryCardProps) {
    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                    Inventory Summary
                </h3>
            </div>

            {!inventory ? (
                <EmptyState title="Inventory data unavailable" />
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-4 border bg-surface-2 border-border">
                        <p className="text-[11px] text-text-3 mb-1">
                            Total Products
                        </p>
                        <p className="mono text-[22px] font-bold tracking-[-0.01em] text-text-1">
                            {String(inventory.totalProducts)}
                        </p>
                    </div>

                    <div className="rounded-xl p-4 border bg-warning-soft border-transparent">
                        <p className="text-[11px] text-text-3 mb-1">Low Stock</p>
                        <p className="mono text-[22px] font-bold tracking-[-0.01em] text-warning">
                            {String(inventory.lowStock)}
                        </p>
                    </div>

                    <div className="rounded-xl p-4 border bg-danger-soft border-transparent">
                        <p className="text-[11px] text-text-3 mb-1">
                            Out of Stock
                        </p>
                        <p className="mono text-[22px] font-bold tracking-[-0.01em] text-danger">
                            {String(inventory.outOfStock)}
                        </p>
                    </div>

                    <div className="rounded-xl p-4 border bg-surface-2 border-border">
                        <p className="text-[11px] text-text-3 mb-1">
                            Inventory Value
                        </p>
                        <p className="mono text-[18px] font-bold tracking-[-0.01em] text-text-1">
                            {formatRevenue(inventory.inventoryValue)}
                        </p>
                    </div>
                </div>
            )}
        </Card>
    );
}
