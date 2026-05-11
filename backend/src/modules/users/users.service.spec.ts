import { UsersService } from './users.service';

// Smoke test scaffold (Rules.md §12).
describe('UsersService', () => {
  it('is importable as a class', () => {
    expect(UsersService).toBeDefined();
    expect(typeof UsersService).toBe('function');
  });
});
