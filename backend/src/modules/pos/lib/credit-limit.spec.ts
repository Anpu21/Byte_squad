import { ConflictException } from '@nestjs/common';
import { assertWithinCreditLimit } from './credit-limit';

describe('assertWithinCreditLimit', () => {
  it('passes when no limit is set (legacy unlimited)', () => {
    expect(() => assertWithinCreditLimit(null, 100000, 50000)).not.toThrow();
  });

  it('passes when no credit is taken', () => {
    expect(() => assertWithinCreditLimit(1000, 5000, 0)).not.toThrow();
  });

  it('passes when the new balance lands exactly on the limit', () => {
    expect(() => assertWithinCreditLimit(1000, 400, 600)).not.toThrow();
  });

  it('throws 409 when the new balance would exceed the limit', () => {
    expect(() => assertWithinCreditLimit(1000, 400, 600.01)).toThrow(
      ConflictException,
    );
  });

  it('reports the remaining credit room in the message', () => {
    try {
      assertWithinCreditLimit(1000, 750, 500);
      fail('expected throw');
    } catch (err) {
      expect((err as Error).message).toContain('available credit 250.00');
    }
  });

  it('treats an over-limit balance as zero room (not negative)', () => {
    try {
      assertWithinCreditLimit(1000, 1200, 1);
      fail('expected throw');
    } catch (err) {
      expect((err as Error).message).toContain('available credit 0.00');
    }
  });
});
