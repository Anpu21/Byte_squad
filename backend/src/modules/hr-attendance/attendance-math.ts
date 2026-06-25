/**
 * Pure time/lateness/overtime helpers for attendance computation.
 * Extracted from attendance.service.ts to keep the service under the
 * 300-line cap and to make the math unit-testable in isolation.
 *
 * Time strings are "HH:mm" or "HH:mm:ss" (Postgres TIME literal).
 * Date returns are UTC-midnight-anchored so they round-trip cleanly
 * through Postgres DATE columns.
 */

/**
 * Parse a clock time (`HH:mm` or `HH:mm:ss`) into total minutes since
 * midnight. Returns `null` for falsy input so callers can detect a
 * missing time without an extra branch.
 */
export function clockToMinutes(
  value: string | null | undefined,
): number | null {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function computeLate(
  checkInTime: string,
  scheduledStart: string,
  graceMinutes: number,
): { isLate: boolean; lateMinutes: number } {
  const checkIn = clockToMinutes(checkInTime);
  const scheduled = clockToMinutes(scheduledStart);
  if (checkIn === null || scheduled === null) {
    return { isLate: false, lateMinutes: 0 };
  }
  const late = Math.max(0, checkIn - scheduled - graceMinutes);
  return { isLate: late > 0, lateMinutes: late };
}

export function computeTotalHours(
  checkInTime: string | null | undefined,
  checkOutTime: string | null | undefined,
): number | null {
  const checkIn = clockToMinutes(checkInTime);
  const checkOut = clockToMinutes(checkOutTime);
  if (checkIn === null || checkOut === null) return null;
  if (checkOut <= checkIn) return 0;
  return Math.round(((checkOut - checkIn) / 60) * 100) / 100;
}

export function computeOvertime(
  checkOutTime: string,
  scheduledEnd: string,
): { isOvertime: boolean; overtimeHours: number } {
  const checkOut = clockToMinutes(checkOutTime);
  const scheduled = clockToMinutes(scheduledEnd);
  if (checkOut === null || scheduled === null) {
    return { isOvertime: false, overtimeHours: 0 };
  }
  const overtime = Math.max(0, checkOut - scheduled);
  return {
    isOvertime: overtime > 0,
    overtimeHours: Math.round((overtime / 60) * 100) / 100,
  };
}

export function todayDate(now: Date): Date {
  // Normalize to date-only at UTC midnight so the `attendance_date`
  // column (Postgres `date`) round-trips cleanly without time-zone
  // drift between server and DB.
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function formatClock(now: Date): string {
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mm = String(now.getUTCMinutes()).padStart(2, '0');
  const ss = String(now.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
