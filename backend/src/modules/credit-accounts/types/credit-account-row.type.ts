import type { CreditAccountStatus } from '@common/enums/credit-account-status.enum';
import type { CreditAccountAgeing } from '@/modules/credit-accounts/types/credit-account-ageing.type';

/**
 * Rich account row for the manager surface — carries both the workflow fields
 * (for the Approvals inbox) and the balance + ageing (for the Accounts table).
 */
export interface CreditAccountRow {
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
  ageing: CreditAccountAgeing;
}
