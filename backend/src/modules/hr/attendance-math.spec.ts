import {
  clockToMinutes,
  computeLate,
  computeOvertime,
  computeTotalHours,
  formatClock,
  todayDate,
} from './attendance-math';

describe('attendance-math', () => {
  describe('clockToMinutes', () => {
    it('parses HH:mm strings to total minutes since midnight', () => {
      expect(clockToMinutes('00:00')).toBe(0);
      expect(clockToMinutes('08:30')).toBe(8 * 60 + 30);
      expect(clockToMinutes('17:45')).toBe(17 * 60 + 45);
    });

    it('parses HH:mm:ss strings the same as HH:mm (seconds ignored)', () => {
      expect(clockToMinutes('08:00:00')).toBe(8 * 60);
      expect(clockToMinutes('16:00:59')).toBe(16 * 60);
    });

    it('returns null for missing or unparseable input', () => {
      expect(clockToMinutes(null)).toBeNull();
      expect(clockToMinutes(undefined)).toBeNull();
      expect(clockToMinutes('')).toBeNull();
      expect(clockToMinutes('not-a-time')).toBeNull();
    });
  });

  describe('computeLate', () => {
    it('flags 5 minutes late when check-in is 20 mins past start with 15-min grace', () => {
      // Mirrors the service-level spec: 08:20 vs 08:00 + 15 grace = 5.
      expect(computeLate('08:20', '08:00:00', 15)).toEqual({
        isLate: true,
        lateMinutes: 5,
      });
    });

    it('does not flag late when check-in is inside the grace window', () => {
      // 08:10 vs 08:00 + 15 grace = within grace, not late.
      expect(computeLate('08:10', '08:00:00', 15)).toEqual({
        isLate: false,
        lateMinutes: 0,
      });
    });

    it('flags 15 minutes late for the cashier self-check-in scenario', () => {
      // 08:30 vs 08:00 + 15 grace = 15 late (mirrors checkInSelf spec).
      expect(computeLate('08:30:00', '08:00:00', 15)).toEqual({
        isLate: true,
        lateMinutes: 15,
      });
    });

    it('returns a not-late zero result when either input is unparseable', () => {
      expect(computeLate('', '08:00:00', 15)).toEqual({
        isLate: false,
        lateMinutes: 0,
      });
      expect(computeLate('08:00', '', 15)).toEqual({
        isLate: false,
        lateMinutes: 0,
      });
    });
  });

  describe('computeTotalHours', () => {
    it('returns 9.5 for an 08:00 → 17:30 shift (rounded to 2dp)', () => {
      expect(computeTotalHours('08:00', '17:30')).toBe(9.5);
    });

    it('returns 0 when check-out is at or before check-in', () => {
      expect(computeTotalHours('08:00', '08:00')).toBe(0);
      expect(computeTotalHours('17:00', '08:00')).toBe(0);
    });

    it('returns null when either time is missing or unparseable', () => {
      expect(computeTotalHours(null, '17:30')).toBeNull();
      expect(computeTotalHours('08:00', undefined)).toBeNull();
      expect(computeTotalHours('', '17:30')).toBeNull();
    });
  });

  describe('computeOvertime', () => {
    it('returns 1.5 hours overtime when check-out is 1h30m past scheduled end', () => {
      // Mirrors the checkOutSelf spec: 17:30 vs 16:00 = 1.5h overtime.
      expect(computeOvertime('17:30:00', '16:00:00')).toEqual({
        isOvertime: true,
        overtimeHours: 1.5,
      });
    });

    it('returns zero overtime when check-out is at or before scheduled end', () => {
      expect(computeOvertime('15:45:00', '16:00:00')).toEqual({
        isOvertime: false,
        overtimeHours: 0,
      });
      expect(computeOvertime('16:00:00', '16:00:00')).toEqual({
        isOvertime: false,
        overtimeHours: 0,
      });
    });

    it('returns a not-overtime zero result when either input is unparseable', () => {
      expect(computeOvertime('', '16:00:00')).toEqual({
        isOvertime: false,
        overtimeHours: 0,
      });
    });
  });

  describe('todayDate', () => {
    it('returns the UTC-midnight Date for the input instant', () => {
      const input = new Date('2026-05-24T08:30:00Z');
      const result = todayDate(input);
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(4); // May (zero-indexed)
      expect(result.getUTCDate()).toBe(24);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
    });

    it('strips the time portion even when input is late in the UTC day', () => {
      const input = new Date('2026-05-24T23:59:59Z');
      const result = todayDate(input);
      expect(result.toISOString()).toBe('2026-05-24T00:00:00.000Z');
    });
  });

  describe('formatClock', () => {
    it('formats a Date as HH:mm:ss in UTC, zero-padded', () => {
      expect(formatClock(new Date('2026-05-24T08:05:00Z'))).toBe('08:05:00');
      expect(formatClock(new Date('2026-05-24T17:30:45Z'))).toBe('17:30:45');
    });

    it('pads single-digit hours/minutes/seconds to two characters', () => {
      expect(formatClock(new Date('2026-05-24T00:00:00Z'))).toBe('00:00:00');
      expect(formatClock(new Date('2026-05-24T01:02:03Z'))).toBe('01:02:03');
    });
  });
});
