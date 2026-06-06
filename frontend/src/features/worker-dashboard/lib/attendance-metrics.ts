import type { IAttendance } from '@/types';

/**
 * Pure derivations for the worker dashboard. Attendance rows are
 * date-only keyed (`attendanceDate` is `YYYY-MM-DD`) so all windowing
 * is done with lexicographic ISO-date comparison — no timezone math.
 */

/** Local calendar date as `YYYY-MM-DD` (matches the BE's date-only keys). */
export function toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** First day of `d`'s month as `YYYY-MM-DD`. */
export function startOfMonthIso(d: Date): string {
    return toIsoDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** `HH:mm` from a `HH:mm:ss` clock string, or em dash when absent. */
export function clockHm(time: string | null): string {
    return time ? time.slice(0, 5) : '—';
}

export interface WorkerAttendanceMetrics {
    /** Today's row if one exists, else null. */
    today: IAttendance | null;
    /** Hours logged today (null until checked out). */
    hoursToday: number | null;
    /** Sum of `totalHours` over the trailing 7 days (1dp). */
    hoursThisWeek: number;
    /** Present + Half_Day rows in the fetched (month-to-date) window. */
    presentDaysThisMonth: number;
    /** Rows flagged late in the fetched window. */
    lateDaysThisMonth: number;
}

/**
 * Derives the dashboard KPIs from a month-to-date set of attendance
 * rows. `now` is injectable so the math is unit-testable without
 * mocking the clock.
 */
export function computeMetrics(
    rows: IAttendance[],
    now: Date = new Date(),
): WorkerAttendanceMetrics {
    const todayIso = toIsoDate(now);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6); // inclusive 7-day window
    const weekStartIso = toIsoDate(weekStart);

    const today = rows.find((r) => r.attendanceDate === todayIso) ?? null;

    let hoursThisWeek = 0;
    let presentDaysThisMonth = 0;
    let lateDaysThisMonth = 0;
    for (const r of rows) {
        if (r.attendanceDate >= weekStartIso && r.attendanceDate <= todayIso) {
            hoursThisWeek += r.totalHours ?? 0;
        }
        if (r.status === 'Present' || r.status === 'Half_Day') {
            presentDaysThisMonth += 1;
        }
        if (r.isLate) lateDaysThisMonth += 1;
    }

    return {
        today,
        hoursToday: today?.totalHours ?? null,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        presentDaysThisMonth,
        lateDaysThisMonth,
    };
}
