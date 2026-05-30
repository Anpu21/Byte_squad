import { useState } from 'react';
import { isCompleteNumber, isPartialDecimal } from '@/lib/numeric-input';

interface IPosCartNumericCellProps {
    /**
     * The committed numeric value owned by the parent row. The cell keeps
     * its own string buffer (so partial entries like `0.` or `.5` don't
     * collapse to `0`) and anchors to this value so an upstream
     * recompute re-seeds the buffer without trampling unrelated cells.
     */
    value: number;
    onCommit: (next: number) => void;
    min: number;
    max?: number;
    disabled?: boolean;
    ariaLabel: string;
    className: string;
}

/**
 * Numeric input that preserves in-progress decimal entries. The string
 * buffer lives in the cell, not the parent — so the cashier can type `0.`
 * and keep typing without the controlled value snapping back to `0`. A
 * full numeric string triggers a live commit; blur commits the current
 * buffer (or restores the upstream value if the buffer is non-numeric).
 * Out-of-range values are clamped against `min`/`max` defensively, so a
 * paste of `200` into a 0-100 field commits as `100`.
 *
 * The "adjust during render" anchor pattern resyncs the buffer when the
 * upstream value changes (e.g., line-math recompute, unit swap) without
 * fighting the no-setState-in-effect lint rule.
 *
 * Renders as a plain text input (`type="text"`) with `inputMode="decimal"`
 * so mobile keyboards still surface a numeric keypad. Non-numeric
 * keystrokes are silently dropped by `isPartialDecimal` (see
 * `@/lib/numeric-input`), which avoids the spinner arrows + scroll-wheel
 * value mutation + scientific-notation acceptance of native
 * `type="number"` inputs.
 */
export function PosCartNumericCell({
    value,
    onCommit,
    min,
    max,
    disabled = false,
    ariaLabel,
    className,
}: IPosCartNumericCellProps) {
    const [buffer, setBuffer] = useState<string>(String(value));
    const [anchor, setAnchor] = useState<number>(value);
    if (value !== anchor) {
        setAnchor(value);
        setBuffer(String(value));
    }

    const clamp = (parsed: number): number => {
        const lower = Math.max(parsed, min);
        return max !== undefined ? Math.min(lower, max) : lower;
    };

    const commit = (raw: string): void => {
        const parsed = parseFloat(raw);
        if (!Number.isFinite(parsed)) return;
        const next = clamp(parsed);
        if (next !== value) onCommit(next);
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            autoComplete="off"
            value={buffer}
            onChange={(e) => {
                const next = e.target.value;
                // Silently drop keystrokes that would produce an invalid buffer
                // (letters, scientific notation, thousands separators, etc.).
                if (!isPartialDecimal(next)) return;
                setBuffer(next);
                if (isCompleteNumber(next)) commit(next);
            }}
            onBlur={() => commit(buffer)}
            disabled={disabled}
            aria-label={ariaLabel}
            className={className}
        />
    );
}
