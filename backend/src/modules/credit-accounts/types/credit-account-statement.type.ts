import type { CreditAccountStatus } from '@common/enums/credit-account-status.enum';
import type { CreditAccountAgeing } from '@/modules/credit-accounts/types/credit-account-ageing.type';

/** One loan-book ledger line (credit taken or paid). */
export interface CreditAccountTransactionRow {
  id: string;
  transactionType: string;
  amount: number;
  runningBalance: number;
  referenceNo: string;
  notes: string | null;
  saleId: string | null;
  createdAt: string;
}

/** An unpaid credit sale on the account, with its overdue status. */
export interface CreditAccountOutstandingSale {
  saleId: string;
  invoiceNumber: string;
  total: number;
  balanceDue: number;
  dueDate: string | null;
  createdAt: string;
  overdueDays: number;
  isOverdue: boolean;
}

/** Full per-account statement: balance, ageing, ledger, and unpaid bills. */
export interface CreditAccountStatement {
  id: string;
  accountNo: string;
  holderName: string;
  phone: string;
  nic: string | null;
  address: string | null;
  branchId: string;
  branchName: string | null;
  status: CreditAccountStatus;
  creditLimit: number | null;
  creditTermDays: number | null;
  currentBalance: number;
  availableCredit: number | null;
  ageing: CreditAccountAgeing;
  transactions: CreditAccountTransactionRow[];
  outstandingSales: CreditAccountOutstandingSale[];
}
