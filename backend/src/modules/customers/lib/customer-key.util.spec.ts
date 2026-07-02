import {
  customerKeyForUser,
  isUserCustomerKey,
  parseCustomerKey,
  phoneToCustomerKey,
  userCustomerKey,
} from './customer-key.util';

describe('customer-key util', () => {
  describe('phoneToCustomerKey', () => {
    it('normalizes SL phones to a bare-digit key (no +)', () => {
      expect(phoneToCustomerKey('0771234567')).toBe('94771234567');
      expect(phoneToCustomerKey('+94771234567')).toBe('94771234567');
      expect(phoneToCustomerKey('077 123 4567')).toBe('94771234567');
    });

    it('returns null for non-SL / invalid input', () => {
      expect(phoneToCustomerKey('12345')).toBeNull();
      expect(phoneToCustomerKey('')).toBeNull();
      expect(phoneToCustomerKey(undefined)).toBeNull();
    });
  });

  describe('customerKeyForUser', () => {
    it('prefers the phone key when the user has a valid phone', () => {
      expect(customerKeyForUser('user-1', '0771234567')).toBe('94771234567');
    });

    it('falls back to u:<id> when the user has no valid phone', () => {
      expect(customerKeyForUser('user-1', null)).toBe('u:user-1');
      expect(customerKeyForUser('user-1', 'not-a-phone')).toBe('u:user-1');
    });
  });

  describe('parseCustomerKey', () => {
    it('round-trips a phone key back to a normalized +94 number', () => {
      const key = phoneToCustomerKey('0771234567')!;
      const parsed = parseCustomerKey(key);
      expect(parsed).toEqual({
        kind: 'phone',
        phone: '+94771234567',
        userId: null,
      });
    });

    it('parses a user key', () => {
      const key = userCustomerKey('user-9');
      expect(isUserCustomerKey(key)).toBe(true);
      expect(parseCustomerKey(key)).toEqual({
        kind: 'user',
        phone: null,
        userId: 'user-9',
      });
    });

    it('yields a null phone for a malformed phone key', () => {
      expect(parseCustomerKey('999').phone).toBeNull();
    });
  });
});
