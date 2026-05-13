import { Sparkles } from 'lucide-react';
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
    const hasDiscount = loyaltyDiscount > 0;

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
                        <span className="tabular-nums">
                            {formatCurrency(it.sellingPrice * it.quantity)}
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-text-2">Subtotal</span>
                    <span className="text-text-1 tabular-nums">
                        {formatCurrency(total)}
                    </span>
                </div>
                {hasDiscount && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-2 inline-flex items-center gap-1.5">
                            <Sparkles
                                size={12}
                                className="text-warning"
                                aria-hidden="true"
                            />
                            Loyalty discount
                        </span>
                        <span className="text-warning tabular-nums">
                            −{formatCurrency(loyaltyDiscount)}
                        </span>
                    </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs uppercase tracking-widest text-text-3">
                        Total
                    </span>
                    <span className="text-lg font-bold text-text-1 tabular-nums">
                        {formatCurrency(finalTotal)}
                    </span>
                </div>
                {expectedPoints > 0 && (
                    <p className="text-[11px] text-text-3 inline-flex items-center gap-1.5">
                        <Sparkles
                            size={11}
                            className="text-warning"
                            aria-hidden="true"
                        />
                        You&apos;ll earn {expectedPoints} point
                        {expectedPoints === 1 ? '' : 's'} when this order is
                        picked up.
                    </p>
                )}
            </div>
        </div>
    );
}
