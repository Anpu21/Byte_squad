import { NotificationsService } from './notifications.service';

// Smoke test scaffold (Rules.md §12). Replaced/extended with real coverage
// during the §7 repository-pattern migration for this module.
describe('NotificationsService', () => {
  it('is importable as a class', () => {
    expect(NotificationsService).toBeDefined();
    expect(typeof NotificationsService).toBe('function');
  });
});
