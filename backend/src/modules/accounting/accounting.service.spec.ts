import { AccountingService } from './accounting.service';

// Smoke test scaffold (Rules.md §12).
describe('AccountingService', () => {
  it('is importable as a class', () => {
    expect(AccountingService).toBeDefined();
    expect(typeof AccountingService).toBe('function');
  });
});
