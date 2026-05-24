import { useState } from 'react';

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
    step?: number;
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
 */
export function PosCartNumericCell({
    value,
    onCommit,
    min,
    max,
    step = 0.01,
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

    const isCompleteNumber = (raw: string): boolean => {
        if (raw.trim() === '') return false;
        return /^-?\d+(\.\d+)?$/.test(raw.trim());
    };

    return (
        <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={buffer}
            onChange={(e) => {
                const next = e.target.value;
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
