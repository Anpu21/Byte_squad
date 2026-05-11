import { BranchesService } from './branches.service';

// Smoke test scaffold (Rules.md §12).
describe('BranchesService', () => {
  it('is importable as a class', () => {
    expect(BranchesService).toBeDefined();
    expect(typeof BranchesService).toBe('function');
  });
});
