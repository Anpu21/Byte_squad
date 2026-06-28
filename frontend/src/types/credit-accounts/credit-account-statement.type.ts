import type {
  CreditAccountStatus,
  ICreditAccountAgeing,
} from './credit-account.type';

/** One loan-book ledger line (credit taken or paid). */
export interface ICreditAccountTransactionRow {
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
export interface ICreditAccountOutstandingSale {
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
export interface ICreditAccountStatement {
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
  ageing: ICreditAccountAgeing;
  transactions: ICreditAccountTransactionRow[];
  outstandingSales: ICreditAccountOutstandingSale[];
}
