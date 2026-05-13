import { PAYMENT_METHODS, type Payment } from '../types/payment.type';

interface PaymentMethodPickerProps {
    value: Payment;
    onChange: (p: Payment) => void;
}

export function PaymentMethodPicker({
    value,
    onChange,
}: PaymentMethodPickerProps) {
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
