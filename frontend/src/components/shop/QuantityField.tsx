import { useState } from 'react';
import { LuMinus as Minus, LuPlus as Plus } from 'react-icons/lu';
import { isCompleteNumber, isPartialDecimal } from '@/lib/numeric-input';

interface QuantityFieldProps {
    /**
     * Committed quantity owned by the parent. The field keeps its own string
     * buffer (so a partial entry like `0.` doesn't collapse to `0` mid-type)
     * and re-anchors when this value changes upstream.
     */
    value: number;
    onChange: (next: number) => void;
    /** +/- tap step. */
    step: number;
    /** Smallest allowed quantity — the − button disables here. */
    min: number;
    /** Max decimal places; `0` forbids a decimal point (countable units). */
    decimals: number;
    /** Suffix shown after the number, e.g. `kg`. */
    unitLabel: string;
    /** Optional upper bound (e.g. available stock) — the + button disables here. */
    max?: number;
    disabled?: boolean;
    ariaLabel: string;
    /**
     * When true, the +/− step follows the last value the user typed (a held
     * "increment"), falling back to `step` until they type. Default: fixed `step`.
     */
    dynamicStep?: boolean;
}

/** True when `raw` has no more fractional digits than `decimals` allows. */
function withinDecimals(raw: string, decimals: number): boolean {
    const dot = raw.indexOf('.');
    if (dot === -1) return true;
    if (decimals === 0) return false;
    return raw.length - dot - 1 <= decimals;
}

const BTN_CLASS =
    'w-9 h-9 flex items-center justify-center rounded-md bg-surface-2 hover:bg-primary-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-[3px] focus:ring-focus/25';

/**
 * Unit-aware quantity selector: − / + stepper around a typeable decimal field,
 * with the unit shown inline. Mirrors the POS cart's decimal cell
 * (`PosCartNumericCell`) — a string buffer preserves in-progress decimals while
 * the parent owns the committed number — but packages it with the stepper used
 * across the storefront. The buffer is capped to `decimals` places at input
 * time, so a countable product (`decimals = 0`) silently refuses a decimal
 * point and never produces a quantity the order API would reject.
 */
export function QuantityField({
    value,
    onChange,
    step,
    min,
    decimals,
    unitLabel,
    max,
    disabled = false,
    ariaLabel,
    dynamicStep = false,
}: QuantityFieldProps) {
    const [buffer, setBuffer] = useState<string>(String(value));
    const [anchor, setAnchor] = useState<number>(value);
    const [typedStep, setTypedStep] = useState<number | null>(null);
    if (value !== anchor) {
        setAnchor(value);
        setBuffer(String(value));
    }

    const factor = 10 ** decimals;
    const round = (n: number): number => Math.round(n * factor) / factor;
    const clamp = (n: number): number => {
        const lower = Math.max(n, min);
        return max !== undefined ? Math.min(lower, max) : lower;
    };

    // The +/− step follows the last typed value when dynamicStep is on, else the
    // fixed `step` prop. Reading `typedStep ?? step` (rather than seeding state
    // once) keeps it correct when `step` arrives after the product query resolves.
    const effectiveStep =
        dynamicStep && typedStep !== null ? typedStep : step;

    const commitTyped = (raw: string): void => {
        const parsed = parseFloat(raw);
        if (!Number.isFinite(parsed)) {
            setBuffer(String(value));
            return;
        }
        const next = clamp(parsed);
        if (dynamicStep && next > 0) setTypedStep(next);
        if (next !== value) onChange(next);
        else setBuffer(String(next));
    };

    const stepBy = (delta: number): void => {
        const next = round(clamp(value + delta));
        if (next !== value) onChange(next);
    };

    const atMin = value <= min;
    const atMax = max !== undefined && value >= max;

    return (
        <div className="inline-flex items-center gap-1.5">
            <button
                type="button"
                onClick={() => stepBy(-effectiveStep)}
                disabled={disabled || atMin}
                aria-label="Decrease quantity"
                className={BTN_CLASS}
            >
                <Minus size={14} />
            </button>

            <div className="inline-flex items-center justify-center gap-1 h-9 px-2.5 rounded-md bg-surface-2 min-w-[4.5rem]">
                <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    autoComplete="off"
                    value={buffer}
                    disabled={disabled}
                    aria-label={ariaLabel}
                    onChange={(e) => {
                        const next = e.target.value;
                        if (!isPartialDecimal(next)) return;
                        if (!withinDecimals(next, decimals)) return;
                        setBuffer(next);
                        if (isCompleteNumber(next)) commitTyped(next);
                    }}
                    onBlur={() => commitTyped(buffer)}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-12 bg-transparent text-center text-sm font-semibold text-text-1 tabular-nums outline-none disabled:opacity-50"
                />
                <span className="text-xs text-text-3 select-none">
                    {unitLabel}
                </span>
            </div>

            <button
                type="button"
                onClick={() => stepBy(effectiveStep)}
                disabled={disabled || atMax}
                aria-label="Increase quantity"
                className={BTN_CLASS}
            >
                <Plus size={14} />
            </button>
        </div>
    );
}
