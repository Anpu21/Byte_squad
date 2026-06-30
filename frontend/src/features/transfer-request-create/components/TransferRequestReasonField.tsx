import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';

interface TransferRequestReasonFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export function TransferRequestReasonField({
    value,
    onChange,
}: TransferRequestReasonFieldProps) {
    return (
        <div className="px-5 py-3 border-t border-border bg-surface">
            <label
                htmlFor="manager-cart-reason"
                className="text-[10px] uppercase tracking-[0.12em] text-text-3 font-semibold block mb-1"
            >
                Reason{' '}
                <span className="text-danger" aria-hidden>
                    *
                </span>
            </label>
            <textarea
                id="manager-cart-reason"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Why does your branch need these products?"
                maxLength={500}
                rows={2}
                required
                aria-required={true}
                className={`${FIELD_SHELL} ${FIELD_BORDER} w-full px-3 py-2 resize-none`}
            />
            <p className="text-[11px] text-text-3 mt-1">
                Required — tell admin why your branch needs these products.
            </p>
        </div>
    );
}
