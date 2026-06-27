import { useState } from 'react';
import { isCompleteNumber, isPartialDecimal } from '@/lib/numeric-input';

interface AmountFieldProps {
    /**
     * Committed cash amount owned by the parent. Like {@link QuantityField},
     * the field keeps its own string buffer (so a partial entry like `100.`
     * doesn't collapse to `100` mid-type) and re-anchors when this changes
     * upstream — e.g. when switching units re-seeds the amount.
     */
    value: number;
    onChange: (next: number) => void;
    /** Quick-pick cash chips; tapping one sets the amount outright. */
    presets?: number[];
    disabled?: boolean;
    ariaLabel: string;
}

/** Money is 2 dp; the buffer refuses a third fractional digit at input time. */
const AMOUNT_DECIMALS = 2;

/** True when `raw` has at most two fractional digits. */
function withinTwoDecimals(raw: string): boolean {
    const dot = raw.indexOf('.');
    return dot === -1 || raw.length - dot - 1 <= AMOUNT_DECIMALS;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

const CHIP_CLASS =
    'px-3 h-8 rounded-md bg-surface-2 text-xs font-medium text-text-2 hover:bg-primary-soft hover:text-text-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-[3px] focus:ring-focus/25';

/**
 * Cash-amount input for "buy by amount": a typeable 2-dp field prefixed with
 * the currency, optionally fronted by quick-pick chips. Mirrors
 * {@link QuantityField}'s string-buffer pattern but drops the stepper — cash is
 * entered or picked, not nudged. The parent owns the committed number and
 * derives the weight it buys.
 */
export function AmountField({
    value,
    onChange,
    presets,
    disabled = false,
    ariaLabel,
}: AmountFieldProps) {
    const [buffer, setBuffer] = useState<string>(value ? String(value) : '');
    const [anchor, setAnchor] = useState<number>(value);
    if (value !== anchor) {
        setAnchor(value);
        setBuffer(value ? String(value) : '');
    }

    const commitTyped = (raw: string): void => {
        const parsed = parseFloat(raw);
        if (!Number.isFinite(parsed) || parsed < 0) {
            setBuffer(value ? String(value) : '');
            return;
        }
        const next = round2(parsed);
        if (next !== value) onChange(next);
        else setBuffer(String(next));
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="inline-flex items-center h-11 px-3 rounded-md bg-surface-2 w-full max-w-[16rem]">
                <span className="text-sm font-medium text-text-3 select-none">
                    LKR
                </span>
                <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    autoComplete="off"
                    placeholder="0.00"
                    value={buffer}
                    disabled={disabled}
                    aria-label={ariaLabel}
                    onChange={(e) => {
                        const next = e.target.value;
                        if (!isPartialDecimal(next)) return;
                        if (!withinTwoDecimals(next)) return;
                        setBuffer(next);
                        if (isCompleteNumber(next)) commitTyped(next);
                    }}
                    onBlur={() => commitTyped(buffer)}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 ml-2 bg-transparent text-right text-base font-semibold text-text-1 tabular-nums outline-none disabled:opacity-50"
                />
            </div>

            {presets && presets.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {presets.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(round2(preset))}
                            className={CHIP_CLASS}
                        >
                            {preset.toLocaleString('en-LK')}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
