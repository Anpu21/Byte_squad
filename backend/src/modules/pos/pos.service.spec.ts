import { PosService } from './pos.service';

// Smoke test scaffold (Rules.md §12).
describe('PosService', () => {
  it('is importable as a class', () => {
    expect(PosService).toBeDefined();
    expect(typeof PosService).toBe('function');
  });
});
