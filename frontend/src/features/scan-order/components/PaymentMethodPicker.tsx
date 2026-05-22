import { useEffect } from 'react';
import { Banknote } from 'lucide-react';
import { PAYMENT_METHODS, type Payment } from '../types/payment.type';

interface PaymentMethodPickerProps {
    value: Payment;
    onChange: (p: Payment) => void;
}

export function PaymentMethodPicker({
    value,
    onChange,
}: PaymentMethodPickerProps) {
    const onlyCash =
        PAYMENT_METHODS.length === 1 && PAYMENT_METHODS[0] === 'cash';

    useEffect(() => {
        if (onlyCash && value !== 'cash') onChange('cash');
    }, [onlyCash, value, onChange]);

    if (onlyCash) {
        return (
            <div>
                <p className="text-[11px] uppercase tracking-widest text-text-3 mb-2">
                    Payment method
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary-soft text-primary-soft-text border border-primary/20">
                    <Banknote size={14} aria-hidden="true" />
                    <span className="text-sm font-semibold">Cash</span>
                </div>
                <p className="mt-2 text-[11px] text-text-3">
                    Pickup orders are settled in cash at the till.
                </p>
            </div>
        );
    }

    return (
        <div>
            <p className="text-[11px] uppercase tracking-widest text-text-3 mb-2">
                Payment method
            </p>
            <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onChange(p)}
                        className={`py-2 text-sm font-semibold rounded-md border transition-colors capitalize ${
                            value === p
                                ? 'bg-primary text-text-inv border-primary'
                                : 'bg-surface text-text-1 border-border hover:border-border-strong'
                        }`}
                    >
                        {p}
                    </button>
                ))}
            </div>
        </div>
    );
}
