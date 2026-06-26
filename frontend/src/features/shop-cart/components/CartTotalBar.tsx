import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { LoyaltyPreviewLine } from './LoyaltyPreviewLine';

interface CartTotalBarProps {
    total: number;
    onCheckout: () => void;
}

export function CartTotalBar({ total, onCheckout }: CartTotalBarProps) {
    return (
        <div className="mt-6 flex items-center justify-between bg-surface border border-border rounded-xl shadow-sm-token p-6">
            <div>
                <p className="text-[11px] uppercase tracking-widest text-text-3">
                    Estimated total
                </p>
                <p className="text-2xl font-bold text-text-1 tracking-tight mt-1 tabular-nums">
                    {formatCurrency(total)}
                </p>
                <div className="mt-2">
                    <LoyaltyPreviewLine total={total} />
                </div>
            </div>
            <Button type="button" variant="primary" size="lg" onClick={onCheckout}>
                Checkout →
            </Button>
        </div>
    );
}
