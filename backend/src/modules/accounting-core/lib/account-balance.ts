import type { AccountType } from '@/modules/accounting-core/types/account-type.type';

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Natural balance per account type: Assets/Expenses carry debit balances
 * (debits − credits); Liabilities/Equity/Income carry credit balances
 * (credits − debits). The trial balance shows raw sums; the balance
 * sheet and P&L-side figures use this signed balance.
 */
export function accountBalance(
  type: AccountType,
  debits: number,
  credits: number,
): number {
  if (type === 'Asset' || type === 'Expense') {
    return round2(debits - credits);
  }
  return round2(credits - debits);
}
