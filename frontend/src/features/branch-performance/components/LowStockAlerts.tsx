import { AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Pill from '@/components/ui/Pill';
import EmptyState from '@/components/ui/EmptyState';
import type { IMyBranchPerformance } from '@/types';

interface LowStockAlertsProps {
    lowStockList: IMyBranchPerformance['lowStockList'];
    lowStockItems: number;
}

export function LowStockAlerts({
    lowStockList,
    lowStockItems,
}: LowStockAlertsProps) {
    return (
        <Card className="lg:col-span-2 overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                    <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                        Low stock alerts
                    </h3>
                    <p className="text-xs text-text-2 mt-0.5">
                        Items at or below threshold
                    </p>
                </div>
                {lowStockList.length > 0 && (
                    <Pill tone="danger">{lowStockItems} total</Pill>
                )}
            </div>
            {lowStockList.length === 0 ? (
                <EmptyState
                    icon={<AlertTriangle size={20} />}
                    title="All stock levels healthy"
                    description="No items are currently below their threshold."
                />
            ) : (
                <div className="divide-y divide-border">
                    {lowStockList.map((item) => {
                        const isOut = item.quantity === 0;
                        return (
                            <div
                                key={item.productId}
                                className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2 transition-colors"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-medium text-text-1 truncate">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-text-3 mt-0.5">
                                        on hand{' '}
                                        <span
                                            className={`mono font-semibold ${
                                                isOut
                                                    ? 'text-danger'
                                                    : 'text-warning'
                                            }`}
                                        >
                                            {item.quantity}
                                        </span>{' '}
                                        / {item.threshold}
                                    </p>
                                </div>
                                <Pill tone={isOut ? 'danger' : 'warning'}>
                                    {isOut ? 'Out of stock' : 'Low'}
                                </Pill>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
