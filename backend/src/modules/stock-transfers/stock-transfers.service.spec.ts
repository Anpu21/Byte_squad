import { StockTransfersService } from './stock-transfers.service';

// Smoke test scaffold (Rules.md §12).
describe('StockTransfersService', () => {
  it('is importable as a class', () => {
    expect(StockTransfersService).toBeDefined();
    expect(typeof StockTransfersService).toBe('function');
  });
});
