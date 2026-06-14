import { Test } from '@nestjs/testing';
import { FinancialReportsService } from './financial-reports.service';
import { FinancialReportsRepository } from './financial-reports.repository';

const SUMS = [
  {
    code: '1000',
    name: 'Cash',
    type: 'Asset' as const,
    debits: 9000,
    credits: 2000,
  },
  {
    code: '1300',
    name: 'Inventory',
    type: 'Asset' as const,
    debits: 5000,
    credits: 1000,
  },
  {
    code: '2000',
    name: 'Accounts Payable',
    type: 'Liability' as const,
    debits: 0,
    credits: 4000,
  },
  {
    code: '3000',
    name: "Owner's Equity",
    type: 'Equity' as const,
    debits: 0,
    credits: 0,
  },
  {
    code: '4000',
    name: 'Sales Revenue',
    type: 'Income' as const,
    debits: 500,
    credits: 9500,
  },
  {
    code: '6000',
    name: 'Operating Expenses',
    type: 'Expense' as const,
    debits: 2000,
    credits: 0,
  },
];

describe('FinancialReportsService', () => {
  let service: FinancialReportsService;
  let repo: jest.Mocked<FinancialReportsRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FinancialReportsService,
        {
          provide: FinancialReportsRepository,
          useValue: {
            accountSums: jest.fn().mockResolvedValue(SUMS),
            unmappedSums: jest
              .fn()
              .mockResolvedValue({ debits: 100, credits: 100 }),
            dayEntries: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(FinancialReportsService);
    repo = moduleRef.get(FinancialReportsRepository);
  });

  it('trial balance sums per account + unmapped bucket and checks equality', async () => {
    const tb = await service.trialBalance(null);
    // 9000+5000+0+0+500+2000 + 100 unmapped
    expect(tb.totalDebits).toBe(16600);
    // 2000+1000+4000+0+9500+0 + 100 unmapped
    expect(tb.totalCredits).toBe(16600);
    expect(tb.balanced).toBe(true);
    expect(tb.unmappedDebits).toBe(100);
    expect(tb.rows).toHaveLength(6);
  });

  it('balance sheet rolls Income−Expense into retained earnings and balances', async () => {
    const bs = await service.balanceSheet(null, '2026-06-10');
    // Assets: (9000−2000) + (5000−1000) = 11000
    expect(bs.totalAssets).toBe(11000);
    // Liabilities: 4000
    expect(bs.totalLiabilities).toBe(4000);
    // Retained earnings: income (9500−500) − expenses 2000 = 7000
    expect(bs.retainedEarnings).toBe(7000);
    // Equity: 0 + 7000
    expect(bs.totalEquity).toBe(7000);
    expect(bs.balanced).toBe(true);
    expect(bs.asOf).toBe('2026-06-10');
  });

  it('day book totals split by side', async () => {
    repo.dayEntries.mockResolvedValue([
      {
        id: 'e1',
        created_at: '2026-06-10T08:00:00Z',
        entry_type: 'credit',
        amount: 500,
        description: 'POS Sale',
        reference_number: 'INV-1',
        account_code: '4000',
        account_name: 'Sales Revenue',
      },
      {
        id: 'e2',
        created_at: '2026-06-10T09:00:00Z',
        entry_type: 'debit',
        amount: 200,
        description: 'Expense',
        reference_number: 'EXP-1',
        account_code: '6000',
        account_name: 'Operating Expenses',
      },
    ]);
    const db = await service.dayBook(null, '2026-06-10');
    expect(db.totalCredits).toBe(500);
    expect(db.totalDebits).toBe(200);
    expect(db.rows[0]?.accountCode).toBe('4000');
  });
});
