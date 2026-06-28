import type { CreditAccountStatus } from '@common/enums/credit-account-status.enum';

/**
 * Lightweight credit-account shape for the POS picker. `availableCredit` is
 * `creditLimit - currentBalance` (null when the limit is unlimited).
 */
export interface CreditAccountSearchResult {
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
