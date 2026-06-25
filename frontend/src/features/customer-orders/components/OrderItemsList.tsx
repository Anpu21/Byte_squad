import type { ICustomerOrder } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface OrderItemsListProps {
    items: ICustomerOrder['items'];
    estimatedTotal: number | string;
    loyaltyDiscountAmount?: number | string;
    finalTotal?: number | string;
    note?: string | null;
}

export function OrderItemsList({
    items,
    estimatedTotal,
    loyaltyDiscountAmount = 0,
    finalTotal,
    note,
}: OrderItemsListProps) {
    const discount = Number(loyaltyDiscountAmount);
    const total = Number(finalTotal ?? estimatedTotal);

    return (
        <>
            <p className="text-[10px] uppercase tracking-widest text-text-3 mb-2">
                Items ({items.length})
            </p>
            <div className="border border-border rounded-md divide-y divide-border max-h-[260px] overflow-y-auto">
                {items.map((item) => {
                    const lineTotal = item.unitPriceSnapshot * item.quantity;
                    return (
                        <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 px-3 py-2"
                        >
                            <div className="min-w-0">
                                <p className="text-[13px] text-text-1 truncate">
                                    {item.product?.name ?? 'Item'}
                                </p>
                                <p className="text-[11px] text-text-3 mono">
                                    {formatCurrency(item.unitPriceSnapshot)} ×{' '}
                                    {item.quantity}
                                </p>
                            </div>
                            <p className="text-[13px] font-semibold text-text-1 tabular-nums whitespace-nowrap mono">
                                {formatCurrency(lineTotal)}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-text-3">Subtotal</p>
                    <p className="text-sm text-text-1 tabular-nums mono">
                        {formatCurrency(Number(estimatedTotal))}
                    </p>
                </div>
                {discount > 0 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-text-3">Loyalty discount</p>
                        <p className="text-sm text-accent tabular-nums mono">
                            -{formatCurrency(discount)}
                        </p>
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <p className="text-xs text-text-3">Final total</p>
                    <p className="text-base font-bold text-text-1 tabular-nums mono">
                        {formatCurrency(total)}
                    </p>
                </div>
            </div>

            {note && (
                <div className="mt-3 px-3 py-2 rounded-md bg-warning-soft border border-warning/40 text-[12px] text-text-1">
                    <span className="font-semibold">Customer note: </span>
                    {note}
                </div>
            )}
        </>
    );
}
