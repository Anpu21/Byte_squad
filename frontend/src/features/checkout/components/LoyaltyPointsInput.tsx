import { Sparkles } from 'lucide-react';

interface LoyaltyPointsInputProps {
    value: number;
    onChange: (next: number) => void;
    availablePoints: number;
    maxRedeemable: number;
}

export function LoyaltyPointsInput({
    value,
    onChange,
    availablePoints,
    maxRedeemable,
}: LoyaltyPointsInputProps) {
    const disabled = maxRedeemable === 0;
    const helper = disabled
        ? availablePoints === 0
            ? 'You have no points to redeem yet'
            : 'No points can be applied to this order'
        : `${availablePoints} available · up to ${maxRedeemable} on this order`;

    return (
        <div>
            <label
                htmlFor="loyalty-points-input"
                className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-text-3 mb-2"
            >
                <Sparkles size={12} className="text-warning" aria-hidden="true" />
                Loyalty points
            </label>
            <div className="flex gap-2">
                <input
                    id="loyalty-points-input"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={maxRedeemable}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => {
                        const next = Number(e.target.value);
                        if (Number.isNaN(next)) return;
                        onChange(Math.max(0, Math.min(next, maxRedeemable)));
                    }}
                    className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-1 focus:outline-none focus:border-primary disabled:opacity-50"
                />
                <button
                    type="button"
                    onClick={() => onChange(maxRedeemable)}
                    disabled={disabled || value === maxRedeemable}
                    className="px-3 text-xs font-semibold bg-warning-soft text-warning rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Use max
                </button>
            </div>
            <p className="mt-1.5 text-[11px] text-text-3">{helper}</p>
        </div>
    );
}
