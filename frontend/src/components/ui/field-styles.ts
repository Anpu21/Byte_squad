import { cn } from '@/lib/utils';

/**
 * Shared "sharp field" styling — the single source of truth for the look of
 * every text input, textarea and select in the app.
 *
 * The `Input` / `Textarea` / `Select` primitives compose these, and any
 * hand-rolled `<input>` / `<textarea>` / `<select>` that can't use a primitive
 * (search boxes, native date pickers, inline table cells) should import these
 * instead of re-deriving the border / radius / focus-ring classes, so the
 * field language stays consistent and drifts in one place only.
 */

/** Box + type + motion. No width, padding, or border color — callers add those. */
export const FIELD_SHELL =
    'bg-surface border rounded-[var(--radius-field)] text-[13px] text-text-1 outline-none ' +
    'transition-[border-color,box-shadow,background-color] duration-150 ease-out ' +
    'placeholder:text-text-3 disabled:opacity-50 disabled:cursor-not-allowed';

/** Resting border + hover + animated focus ring for a valid field. */
export const FIELD_BORDER =
    'border-border-strong hover:border-text-3 focus:border-focus focus:ring-[3px] focus:ring-focus/25';

/** Border + focus ring for an invalid field. */
export const FIELD_ERROR =
    'border-danger focus:border-danger focus:ring-[3px] focus:ring-danger/30';

/** Standard field heights. md = 44px (default), lg = 48px. */
export const FIELD_HEIGHT = { md: 'h-11', lg: 'h-12' } as const;

/** One-shot shake, applied to a field wrapper when an error first appears. */
export const FIELD_SHAKE = 'field-error-shake';

export type FieldSize = keyof typeof FIELD_HEIGHT;

/**
 * Complete className for a standalone single-line field with no floating label
 * (search, date, inline). Composes the shell + height + padding + border state.
 */
export function fieldClass(opts?: {
    error?: boolean;
    size?: FieldSize;
    className?: string;
}): string {
    const { error, size = 'md', className } = opts ?? {};
    return cn(
        FIELD_SHELL,
        'w-full',
        FIELD_HEIGHT[size],
        'px-3',
        error ? FIELD_ERROR : FIELD_BORDER,
        className,
    );
}
