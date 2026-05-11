import { ProductsService } from './products.service';

// Smoke test scaffold (Rules.md §12).
describe('ProductsService', () => {
  it('is importable as a class', () => {
    expect(ProductsService).toBeDefined();
    expect(typeof ProductsService).toBe('function');
  });
});
