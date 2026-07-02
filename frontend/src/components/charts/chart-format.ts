/** Compact axis/tooltip number: 1.2M / 45k / 999. */
export function compactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}k`;
  }
  return value.toLocaleString();
}

/** Compact currency for chart axes ("Rs 45k"). */
export function compactCurrency(value: number): string {
  return `Rs ${compactNumber(value)}`;
}

/** Tooltip cell value: numbers compacted, strings passed through, empty → "0". */
export function chartValue(value: number | string | undefined): string {
  if (typeof value === "number") return compactNumber(value);
  return value ? String(value) : "0";
}
