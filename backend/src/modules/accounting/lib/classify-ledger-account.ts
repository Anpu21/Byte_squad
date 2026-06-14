import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import {
  ACCOUNT_CODES,
  type AccountCode,
} from '@accounting/types/account-code.type';

/**
 * Map a legacy-shaped ledger posting (no explicit account) onto the chart
 * of accounts from its reference prefix / shape. MUST stay in lockstep
 * with the backfill rules in the CreateAccounts migration — runtime
 * classification and historical backfill have to agree.
 */
export function classifyLedgerAccount(input: {
  referenceNumber?: string | null;
  entryType: LedgerEntryType;
  saleId?: string | null;
}): AccountCode {
  const ref = input.referenceNumber ?? '';

  if (ref.startsWith('GRN-') || ref.startsWith('PRET-')) {
    return ACCOUNT_CODES.INVENTORY;
  }
  if (ref.startsWith('CRPAY-')) {
    return ACCOUNT_CODES.CASH;
  }
  if (ref.startsWith('EXP-')) {
    return ACCOUNT_CODES.OPERATING_EXPENSES;
  }
  if (ref.startsWith('RET-')) {
    // Sales-return refund — contra revenue.
    return ACCOUNT_CODES.SALES_REVENUE;
  }
  if (input.saleId) {
    // Sale postings and their void reversals.
    return ACCOUNT_CODES.SALES_REVENUE;
  }
  return input.entryType === LedgerEntryType.CREDIT
    ? ACCOUNT_CODES.OTHER_INCOME
    : ACCOUNT_CODES.OPERATING_EXPENSES;
}
