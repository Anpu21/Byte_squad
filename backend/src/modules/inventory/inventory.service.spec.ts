import { InventoryService } from './inventory.service';

// Smoke test scaffold (Rules.md §12).
describe('InventoryService', () => {
  it('is importable as a class', () => {
    expect(InventoryService).toBeDefined();
    expect(typeof InventoryService).toBe('function');
  });
});
