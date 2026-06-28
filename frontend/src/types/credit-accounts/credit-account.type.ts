/** Lifecycle of a customer store-credit ("khata") account. */
export type CreditAccountStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'CLOSED';

/**
 * Outstanding balance bucketed by how far past its due date it is. `notDue`
 * is not-yet-due (or has no due date); the rest are overdue bands.
 */
export interface ICreditAccountAgeing {
  notDue: number;
  d1to30: number;
  d31to60: number;
  d61to90: number;
  d90plus: number;
  overdueTotal: number;
  outstandingTotal: number;
}

/** A credit account as returned by the workflow endpoints (create/approve/…). */
export interface ICreditAccount {
  id: string;
  accountNo: string;
  holderName: string;
  phone: string;
  nic: string | null;
  address: string | null;
  branchId: string;
  status: CreditAccountStatus;
  creditLimit: number | null;
  creditTermDays: number | null;
  currentBalance: number;
  requestedCreditLimit: number | null;
  userId: string | null;
  loyaltyCustomerId: string | null;
  requestedByUserId: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  requestNote: string | null;
  approvalNote: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Rich account row for the manager surface — carries the workflow fields (for
 * the Approvals inbox) plus balance + ageing (for the Accounts table).
 * `availableCredit` is `creditLimit - currentBalance` (null = unlimited).
 */
export interface ICreditAccountRow {
  id: string;
  accountNo: string;
  holderName: string;
  phone: string;
  nic: string | null;
  branchId: string;
  branchName: string | null;
  status: CreditAccountStatus;
  creditLimit: number | null;
  creditTermDays: number | null;
  currentBalance: number;
  availableCredit: number | null;
  requestedCreditLimit: number | null;
  requestNote: string | null;
  approvalNote: string | null;
  rejectionReason: string | null;
  requestedByUserId: string;
  requestedByName: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  ageing: ICreditAccountAgeing;
}

/** Lightweight credit-account shape for the POS picker. */
export interface ICreditAccountSearchResult {
  id: string;
  accountNo: string;
  holderName: string;
  phone: string;
  status: CreditAccountStatus;
  creditLimit: number | null;
  currentBalance: number;
  availableCredit: number | null;
  creditTermDays: number | null;
}
