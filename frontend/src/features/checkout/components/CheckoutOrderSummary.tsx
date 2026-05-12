import { formatCurrency } from '@/lib/utils';
import type { ShopCartItem } from '@/store/slices/shopCartSlice';

interface CheckoutOrderSummaryProps {
    items: ShopCartItem[];
    total: number;
}

export function CheckoutOrderSummary({
    items,
    total,
}: CheckoutOrderSummaryProps) {
    return (
        <div className="bg-surface border border-border rounded-md p-5">
            <p className="text-[11px] uppercase tracking-widest text-text-3 mb-3">
                Order summary
            </p>
            <div className="space-y-1.5 text-sm">
                {items.map((it) => (
                    <div
                        key={it.productId}
                        className="flex items-center justify-between text-text-1"
                    >
                        <span className="truncate pr-2">
                            {it.name} × {it.quantity}
                        </span>
                        <span>
                            {formatCurrency(it.sellingPrice * it.quantity)}
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-text-3">
                    Estimated total
                </span>
                <span className="text-lg font-bold text-text-1">
                    {formatCurrency(total)}
                </span>
            </div>
        </div>
    );
}
