import { AuthService } from './auth.service';

// Smoke test scaffold (Rules.md §12).
describe('AuthService', () => {
  it('is importable as a class', () => {
    expect(AuthService).toBeDefined();
    expect(typeof AuthService).toBe('function');
  });
});
