import {
  daysToExpiry,
  severityForDays,
  EXPIRY_CRITICAL_DAYS,
  EXPIRY_WARNING_DAYS,
} from '@inventory/lib/expiry-severity';

describe('expiry-severity', () => {
  const now = new Date('2026-06-04T10:00:00Z');

  describe('daysToExpiry', () => {
    it('returns 0 for an item expiring today (calendar-day boundary)', () => {
      expect(daysToExpiry('2026-06-04', now)).toBe(0);
    });

    it('counts whole days forward', () => {
      expect(daysToExpiry('2026-06-11', now)).toBe(7);
      expect(daysToExpiry('2026-07-04', now)).toBe(30);
    });

    it('is negative once expired', () => {
      expect(daysToExpiry('2026-06-01', now)).toBe(-3);
    });
  });

  describe('severityForDays', () => {
    it('buckets expired / critical / warning / ok at the thresholds', () => {
      expect(severityForDays(-1)).toBe('expired');
      expect(severityForDays(0)).toBe('critical');
      expect(severityForDays(EXPIRY_CRITICAL_DAYS)).toBe('critical');
      expect(severityForDays(EXPIRY_CRITICAL_DAYS + 1)).toBe('warning');
      expect(severityForDays(EXPIRY_WARNING_DAYS)).toBe('warning');
      expect(severityForDays(EXPIRY_WARNING_DAYS + 1)).toBe('ok');
    });
  });
});
