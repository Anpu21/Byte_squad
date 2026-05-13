import { formatCurrency } from '@/lib/utils';
import { LoyaltyPreviewLine } from '@/features/shop-cart/components/LoyaltyPreviewLine';

interface CartFooterProps {
    total: number;
    onViewCart: () => void;
    onCheckout: () => void;
}

export function CartFooter({
    total,
    onViewCart,
    onCheckout,
}: CartFooterProps) {
    return (
        <footer className="border-t border-border px-5 py-4 space-y-3 bg-canvas">
            <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-text-3">
                    Estimated total
                </span>
                <span className="text-lg font-bold text-text-1 tabular-nums">
                    {formatCurrency(total)}
                </span>
            </div>
            <LoyaltyPreviewLine total={total} />
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onViewCart}
                    className="px-3 py-2 text-xs font-semibold bg-surface-2 text-text-1 rounded-lg hover:bg-primary-soft transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                >
                    View full cart
                </button>
                <button
                    type="button"
                    onClick={onCheckout}
                    className="px-3 py-2 text-xs font-semibold bg-primary text-text-inv rounded-lg hover:bg-primary-hover transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                >
                    Checkout →
                </button>
            </div>
        </footer>
    );
}
