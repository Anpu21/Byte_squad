import { useState } from 'react';
import { LuStar } from 'react-icons/lu';

interface StarRatingProps {
    /** Current rating. Fractions render as a partial fill (read-only mode). */
    value: number;
    /** Number of stars. Default 5. */
    max?: number;
    /** Star size in px. Default 14. */
    size?: number;
    /** Read-only display (default) vs an interactive 1–max picker. */
    readOnly?: boolean;
    /** Called with 1..max when a star is picked (interactive mode). */
    onChange?: (value: number) => void;
    /** Review count, shown as “(n)” after the stars (read-only). */
    count?: number;
    /** Show the numeric value, e.g. “4.5” (read-only). */
    showValue?: boolean;
    /** Accessible label override for the whole control. */
    ariaLabel?: string;
}

const clampRatio = (n: number): number => Math.max(0, Math.min(1, n));

/**
 * Star rating — a read-only display that supports fractional fills (for an
 * average like 4.3) and an interactive 1–max picker (for the review form).
 * Amber `--warning` filled stars over muted `--border-strong` empties. The
 * wrapper carries the accessible label; individual stars are decorative.
 */
export function StarRating({
    value,
    max = 5,
    size = 14,
    readOnly = true,
    onChange,
    count,
    showValue = false,
    ariaLabel,
}: StarRatingProps) {
    const [hover, setHover] = useState<number | null>(null);

    if (!readOnly) {
        return (
            <div
                role="radiogroup"
                aria-label={ariaLabel ?? 'Rate this product'}
                className="inline-flex items-center gap-0.5"
            >
                {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
                    const active = (hover ?? value) >= star;
                    return (
                        <button
                            key={star}
                            type="button"
                            role="radio"
                            aria-checked={value === star}
                            aria-label={`${star} star${star === 1 ? '' : 's'}`}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(null)}
                            onClick={() => onChange?.(star)}
                            className="p-0.5 rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-[3px] focus:ring-focus/25"
                        >
                            <LuStar
                                size={size}
                                className={
                                    active
                                        ? 'text-warning fill-warning'
                                        : 'text-border-strong'
                                }
                            />
                        </button>
                    );
                })}
            </div>
        );
    }

    const label =
        ariaLabel ??
        `${value.toFixed(1)} out of ${max} stars` +
            (count !== undefined ? `, ${count} reviews` : '');

    return (
        <span
            role="img"
            aria-label={label}
            className="inline-flex items-center gap-0.5 align-middle"
        >
            {Array.from({ length: max }, (_, i) => clampRatio(value - i)).map(
                (ratio, i) => (
                    <span
                        key={i}
                        className="relative inline-flex shrink-0"
                        style={{ width: size, height: size }}
                        aria-hidden="true"
                    >
                        <LuStar
                            size={size}
                            className="absolute left-0 top-0 text-border-strong"
                        />
                        <span
                            className="absolute left-0 top-0 overflow-hidden"
                            style={{ width: `${ratio * 100}%`, height: size }}
                        >
                            <LuStar
                                size={size}
                                className="text-warning fill-warning"
                            />
                        </span>
                    </span>
                ),
            )}
            {showValue && (
                <span className="ml-1 text-[12px] font-medium text-text-2 tabular-nums">
                    {value.toFixed(1)}
                </span>
            )}
            {count !== undefined && (
                <span className="ml-1 text-[12px] text-text-3 tabular-nums">
                    ({count})
                </span>
            )}
        </span>
    );
}
