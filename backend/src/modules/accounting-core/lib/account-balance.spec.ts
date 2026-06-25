import { accountBalance } from './account-balance';

describe('accountBalance', () => {
  it('assets and expenses carry debit balances', () => {
    expect(accountBalance('Asset', 1000, 250)).toBe(750);
    expect(accountBalance('Expense', 500, 0)).toBe(500);
  });

  it('liabilities, equity, and income carry credit balances', () => {
    expect(accountBalance('Liability', 250, 1000)).toBe(750);
    expect(accountBalance('Equity', 0, 5000)).toBe(5000);
    expect(accountBalance('Income', 100, 900)).toBe(800);
  });

  it('rounds to cents', () => {
    expect(accountBalance('Asset', 10.005, 0)).toBe(10.01);
  });
});
