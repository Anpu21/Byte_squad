import type { ReactNode } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useMyOrdersPage } from '@/features/my-orders/hooks/useMyOrdersPage';
import { MyOrdersEmpty } from '@/features/my-orders/components/MyOrdersEmpty';
import { MyOrderCard } from '@/features/my-orders/components/MyOrderCard';

function StatCard({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="min-w-[130px] rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm-token">
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-3">
                {label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-text-1 tabular-nums">
                {value}
            </p>
        </div>
    );
}

export function MyOrdersPage() {
    const p = useMyOrdersPage();

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    {p.activeCount > 0 && (
                        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-text">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                            {p.activeCount} in progress
                        </span>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-1 tracking-tight">
                        My pickup orders
                    </h1>
                    <p className="mt-1.5 max-w-xl text-sm text-text-2">
                        Track every order from placed to picked up. Tap{' '}
                        <strong className="font-semibold text-text-1">View</strong>{' '}
                        to reveal the pickup QR and full breakdown — no page reload.
                    </p>
                </div>
                {!p.isLoading && p.orders.length > 0 && (
                    <div className="flex gap-3">
                        <StatCard label="Awaiting pickup" value={p.activeCount} />
                        <StatCard
                            label="This month"
                            value={formatCurrency(p.thisMonthTotal)}
                        />
                    </div>
                )}
            </div>

            {p.isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                </div>
            ) : p.orders.length === 0 ? (
                <MyOrdersEmpty />
            ) : (
                <div className="flex flex-col gap-4">
                    {p.orders.map((order) => (
                        <MyOrderCard
                            key={order.id}
                            order={order}
                            expanded={p.expandedId === order.id}
                            onToggle={() => p.toggleExpanded(order.id)}
                            onCancel={p.onCancel}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
