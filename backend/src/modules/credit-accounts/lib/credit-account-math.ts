/** Round to 2 decimals (money). */
export const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface FifoSale {
  id: string;
  balanceDue: number;
}

export interface FifoAllocation {
  id: string;
  applied: number;
  newDue: number;
}

/**
 * Allocate a repayment across outstanding sales in the order given (callers
 * pass them oldest-due-first), so the most overdue bills clear first and the
 * ageing buckets stay truthful. Returns one allocation per touched sale.
 */
export function allocateFifo(
  sales: FifoSale[],
  amount: number,
): FifoAllocation[] {
  let remaining = round2(amount);
  const allocations: FifoAllocation[] = [];
  for (const sale of sales) {
    if (remaining <= 0) break;
    const due = round2(sale.balanceDue);
    const applied = Math.min(due, remaining);
    if (applied <= 0) continue;
    remaining = round2(remaining - applied);
    allocations.push({ id: sale.id, applied, newDue: round2(due - applied) });
  }
  return allocations;
}

/**
 * Whole days a bill is past its due date as of `asOf` (UTC date math). Returns
 * 0 when not yet due or when there is no due date.
 */
export function overdueDays(dueDate: string | null, asOf: Date): number {
  if (!dueDate) return 0;
  const due = Date.parse(`${dueDate}T00:00:00Z`);
  if (Number.isNaN(due)) return 0;
  const today = Date.UTC(
    asOf.getUTCFullYear(),
    asOf.getUTCMonth(),
    asOf.getUTCDate(),
  );
  const days = Math.floor((today - due) / 86_400_000);
  return days > 0 ? days : 0;
}
