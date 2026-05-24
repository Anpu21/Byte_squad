/**
 * Regex matching a value the user might still be typing — empty, a partial
 * decimal like `0.` or `.5`, or a fully-formed number. Anchored both ends.
 */
const PARTIAL_DECIMAL_RE = /^\d*\.?\d*$/;

/**
 * Regex matching only fully-formed numbers ready to commit. Rejects trailing
 * (`0.`) or leading-only (`.5`) decimal points and empty strings.
 */
const COMPLETE_NUMBER_RE = /^-?\d+(\.\d+)?$/;

/**
 * True when `raw` is a value the user might still be typing. Use in
 * controlled-input `onChange` handlers to gate which keystrokes land in
 * the buffer — non-matching input is silently dropped so the field
 * appears to "reject" letters, scientific notation (`e`/`E`), thousands
 * separators (`,`), multiple decimal points, leading whitespace, etc.
 */
export function isPartialDecimal(raw: string): boolean {
    return raw === '' || PARTIAL_DECIMAL_RE.test(raw);
}

/**
 * True only when `raw` is a complete, well-formed number. Use to decide
 * when a live commit should fire while the user is still typing — `0.5`
 * commits, `0.` does not. Trims leading/trailing whitespace first so a
 * stray space doesn't block a commit on an otherwise-valid value.
 */
export function isCompleteNumber(raw: string): boolean {
    return COMPLETE_NUMBER_RE.test(raw.trim());
}
