import { formatCurrency } from '@/lib/utils';
import type { ShopCartItem } from '@/store/slices/shopCartSlice';

interface CheckoutOrderSummaryProps {
    items: ShopCartItem[];
    total: number;
    loyaltyDiscount: number;
    finalTotal: number;
    expectedPoints: number;
}

export function CheckoutOrderSummary({
    items,
    total,
    loyaltyDiscount,
    finalTotal,
    expectedPoints,
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
            <div className="mt-3 pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-text-2">Subtotal</span>
                    <span className="text-text-1">{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-text-2">Loyalty discount</span>
                    <span className="text-accent">
                        -{formatCurrency(loyaltyDiscount)}
                    </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs uppercase tracking-widest text-text-3">
                        Final total
                    </span>
                    <span className="text-lg font-bold text-text-1">
                        {formatCurrency(finalTotal)}
                    </span>
                </div>
                <p className="text-[11px] text-text-3">
                    Earn {expectedPoints} point{expectedPoints === 1 ? '' : 's'} after pickup completion.
                </p>
            </div>
        </div>
    );
}
