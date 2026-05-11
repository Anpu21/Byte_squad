import { AdminPortalService } from './admin-portal.service';

// Smoke test scaffold (Rules.md §12).
describe('AdminPortalService', () => {
  it('is importable as a class', () => {
    expect(AdminPortalService).toBeDefined();
    expect(typeof AdminPortalService).toBe('function');
  });
});
