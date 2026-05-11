import { EmailService } from './email.service';

// Smoke test scaffold (Rules.md §12).
describe('EmailService', () => {
  it('is importable as a class', () => {
    expect(EmailService).toBeDefined();
    expect(typeof EmailService).toBe('function');
  });
});
