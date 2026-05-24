interface IPosKeepBalanceToggleProps {
    /** Available only when the tender exceeds the invoice total. */
    enabled: boolean;
    value: boolean;
    onChange: (next: boolean) => void;
}

/**
 * Checkbox that opts the cashier into keeping the overpay as customer
 * credit rather than handing it back as change. Disabled when the
 * tender total does not exceed the invoice (the flag would be a no-op).
 */
export function PosKeepBalanceToggle({
    enabled,
    value,
    onChange,
}: IPosKeepBalanceToggleProps) {
    return (
        <label
            className={`flex items-start gap-2 text-[12px] ${
                enabled ? 'text-text-1' : 'text-text-3'
            }`}
        >
            <input
                type="checkbox"
                checked={value && enabled}
                disabled={!enabled}
                onChange={(e) => onChange(e.target.checked)}
                aria-label="Keep balance as customer credit"
                className="mt-0.5 accent-primary disabled:cursor-not-allowed"
            />
            <span>
                Keep balance as customer credit
                <span className="block text-[11px] text-text-3">
                    Available when the tender exceeds the invoice total.
                </span>
            </span>
        </label>
    );
}
