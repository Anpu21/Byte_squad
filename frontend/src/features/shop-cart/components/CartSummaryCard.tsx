import { LuArrowRight as ArrowRight } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import { cn, formatCurrency } from '@/lib/utils';
import { LoyaltyPreviewLine } from './LoyaltyPreviewLine';

interface CartSummaryCardProps {
    total: number;
    itemCount: number;
    branchCount: number;
    onCheckout: () => void;
    className?: string;
}

/** Sticky order summary for the cart's right column. */
export function CartSummaryCard({
    total,
    itemCount,
    branchCount,
    onCheckout,
    className,
}: CartSummaryCardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-border bg-surface p-6 shadow-sm-token',
                className,
            )}
        >
            <h2 className="text-base font-semibold text-text-1">Order summary</h2>

            <div className="mt-4 flex items-center justify-between text-sm text-text-2">
                <span>
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    {branchCount > 1 ? ` · ${branchCount} branches` : ''}
                </span>
                <span className="tabular-nums text-text-1">
                    {formatCurrency(total)}
                </span>
            </div>

            <div className="mt-4 border-t border-border pt-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-3">
                    Estimated total
                </p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-text-1 tabular-nums">
                    {formatCurrency(total)}
                </p>
                <div className="mt-2">
                    <LoyaltyPreviewLine total={total} />
                </div>
            </div>

            <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={onCheckout}
                className="mt-5 w-full"
            >
                Proceed to checkout <ArrowRight size={16} />
            </Button>

            {branchCount > 1 && (
                <p className="mt-3 text-xs text-text-3">
                    One pickup order per branch under a single payment.
                </p>
            )}
        </div>
    );
}
