import { formatCurrencyWhole, formatNumber } from "./format";

export function money(value: number) {
  return (
    <span className="mono font-semibold tabular-nums">
      {formatCurrencyWhole(value)}
    </span>
  );
}

export function count(value: number, digits = 0) {
  return (
    <span className="mono font-semibold tabular-nums">
      {formatNumber(value, digits)}
    </span>
  );
}
