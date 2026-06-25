import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { ACCOUNT_CODES } from '@/modules/accounting-core/types/account-code.type';
import { classifyLedgerAccount } from './classify-ledger-account';

describe('classifyLedgerAccount', () => {
  it.each([
    ['GRN-2026-000001', LedgerEntryType.DEBIT, null, ACCOUNT_CODES.INVENTORY],
    ['PRET-2026-000001', LedgerEntryType.CREDIT, null, ACCOUNT_CODES.INVENTORY],
    ['CRPAY-1A2B3C4D', LedgerEntryType.CREDIT, null, ACCOUNT_CODES.CASH],
    [
      'EXP-DEADBEEF',
      LedgerEntryType.DEBIT,
      null,
      ACCOUNT_CODES.OPERATING_EXPENSES,
    ],
    ['RET-12345678', LedgerEntryType.DEBIT, null, ACCOUNT_CODES.SALES_REVENUE],
  ])('maps %s to the right account', (ref, entryType, saleId, expected) => {
    expect(
      classifyLedgerAccount({ referenceNumber: ref, entryType, saleId }),
    ).toBe(expected);
  });

  it('maps sale-linked entries to Sales Revenue (sale + void reversal)', () => {
    expect(
      classifyLedgerAccount({
        referenceNumber: 'INV-2026-000123',
        entryType: LedgerEntryType.CREDIT,
        saleId: 'sale-1',
      }),
    ).toBe(ACCOUNT_CODES.SALES_REVENUE);
    expect(
      classifyLedgerAccount({
        referenceNumber: 'INV-2026-000123',
        entryType: LedgerEntryType.DEBIT,
        saleId: 'sale-1',
      }),
    ).toBe(ACCOUNT_CODES.SALES_REVENUE);
  });

  it('falls back by entry type when nothing matches', () => {
    expect(
      classifyLedgerAccount({
        referenceNumber: 'MISC-1',
        entryType: LedgerEntryType.CREDIT,
      }),
    ).toBe(ACCOUNT_CODES.OTHER_INCOME);
    expect(
      classifyLedgerAccount({
        referenceNumber: null,
        entryType: LedgerEntryType.DEBIT,
      }),
    ).toBe(ACCOUNT_CODES.OPERATING_EXPENSES);
  });
});
