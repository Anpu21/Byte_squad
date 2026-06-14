/**
 * One customer line on the receivables report: live balance, limit, and
 * the unpaid credit-sale remainders bucketed by sale age (days).
 */
export interface ReceivableRow {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  currentBalance: number;
  creditLimit: number | null;
  b0to30: number;
  b31to60: number;
  b61to90: number;
  b90plus: number;
  unpaidTotal: number;
}
