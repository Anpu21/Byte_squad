import { formatCurrency } from '@/lib/utils';

interface CartTotalBarProps {
    total: number;
    onCheckout: () => void;
}

export function CartTotalBar({ total, onCheckout }: CartTotalBarProps) {
    return (
        <div className="mt-6 flex items-center justify-between bg-surface border border-border rounded-md p-5">
            <div>
                <p className="text-[11px] uppercase tracking-widest text-text-3">
                    Estimated total
                </p>
                <p className="text-2xl font-bold text-text-1 tracking-tight mt-1">
                    {formatCurrency(total)}
                </p>
            </div>
            <button
                type="button"
                onClick={onCheckout}
                className="px-5 py-2.5 bg-primary text-text-inv font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
                Checkout →
            </button>
        </div>
    );
}
