import { ShopService } from './shop.service';

// Smoke test scaffold (Rules.md §12).
describe('ShopService', () => {
  it('is importable as a class', () => {
    expect(ShopService).toBeDefined();
    expect(typeof ShopService).toBe('function');
  });
});
