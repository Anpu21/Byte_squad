import type { ICustomerRequest } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ShopRequestItemsListProps {
    items: ICustomerRequest['items'];
    estimatedTotal: number | string;
    note?: string | null;
}

export default function ShopRequestItemsList({
    items,
    estimatedTotal,
    note,
}: ShopRequestItemsListProps) {
    return (
        <>
            <div className="border-t border-border pt-3 flex-1 overflow-y-auto max-h-[240px]">
                <p className="text-[10px] uppercase tracking-widest text-text-3 mb-2">
                    Items
                </p>
                <ul className="divide-y divide-border">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className="flex items-center justify-between gap-3 py-2"
                        >
                            <div className="min-w-0">
                                <p className="text-[13px] text-text-1 truncate">
                                    {item.product?.name ?? 'Item'}
                                </p>
                                <p className="text-[11px] text-text-3">
                                    {formatCurrency(item.unitPriceSnapshot)} ×{' '}
                                    {item.quantity}
                                </p>
                            </div>
                            <p className="text-[13px] font-medium text-text-1 tabular-nums whitespace-nowrap">
                                {formatCurrency(
                                    item.unitPriceSnapshot * item.quantity,
                                )}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
                <p className="text-xs text-text-3">Estimated total</p>
                <p className="text-base font-bold text-text-1 tabular-nums">
                    {formatCurrency(Number(estimatedTotal))}
                </p>
            </div>

            {note && (
                <div className="mt-3 px-3 py-2 rounded-md bg-surface-2 border border-border text-[12px] text-text-2">
                    <span className="font-semibold text-text-1">Note: </span>
                    {note}
                </div>
            )}
        </>
    );
}
