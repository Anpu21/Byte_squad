import type {
    AttendanceStatus,
    IAttendance,
    IBulkAttendanceRow,
} from '@/types';

/**
 * Helpers for the manager attendance grid. Pure data transforms so
 * the grid component stays focused on layout and edits stay
 * predictable across re-renders.
 */

export interface IGridCell {
    employeeId: string;
    attendanceDate: string;
    status: AttendanceStatus;
    checkInTime: string;
    checkOutTime: string;
}

/** Format a Date as `YYYY-MM-DD` (local, no UTC drift). */
export function formatIsoDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/** Compose `YYYY-MM` from a year/month (1-based). */
export function formatIsoMonth(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
}

/** Parse `YYYY-MM` into a `{ year, month }` pair (month is 1-based). */
export function parseIsoMonth(value: string): { year: number; month: number } {
    const [y, m] = value.split('-').map(Number);
    return { year: y, month: m };
}

/**
 * All `YYYY-MM-DD` strings in the given month, in calendar order.
 * `month` is 1-based to mirror the picker UI; we hand it to `Date`
 * with a -1 because `Date` accepts 0-based months.
 */
export function monthDays(year: number, month: number): string[] {
    const days: string[] = [];
    const total = new Date(year, month, 0).getDate();
    for (let d = 1; d <= total; d += 1) {
        days.push(formatIsoDate(new Date(year, month - 1, d)));
    }
    return days;
}

/** First day of the month as `YYYY-MM-DD`. */
export function firstDayOfMonth(year: number, month: number): string {
    return formatIsoDate(new Date(year, month - 1, 1));
}

/** Last day of the month as `YYYY-MM-DD`. */
export function lastDayOfMonth(year: number, month: number): string {
    const total = new Date(year, month, 0).getDate();
    return formatIsoDate(new Date(year, month - 1, total));
}

/** Saturday or Sunday in local time — used to seed status `Weekend`. */
export function isWeekend(isoDate: string): boolean {
    const [y, m, d] = isoDate.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    return day === 0 || day === 6;
}

/**
 * Build the initial edit-state grid for `(employees × days)`. Each
 * cell is seeded from the existing attendance row when present;
 * otherwise the status defaults to `Weekend` for weekends and the
 * empty string is left in for both clock fields.
 *
 * The map is keyed by `${employeeId}|${date}` so cell updates are
 * single-key writes — no nested-object copy churn during typing.
 */
export function seedGridCells(
    employeeIds: string[],
    days: string[],
    rows: IAttendance[],
): Record<string, IGridCell> {
    const byKey = new Map<string, IAttendance>();
    for (const row of rows) {
        byKey.set(`${row.employeeId}|${row.attendanceDate}`, row);
    }
    const cells: Record<string, IGridCell> = {};
    for (const employeeId of employeeIds) {
        for (const date of days) {
            const key = `${employeeId}|${date}`;
            const existing = byKey.get(key);
            cells[key] = {
                employeeId,
                attendanceDate: date,
                status: existing
                    ? existing.status
                    : isWeekend(date)
                      ? 'Weekend'
                      : 'Absent',
                checkInTime: existing?.checkInTime ?? '',
                checkOutTime: existing?.checkOutTime ?? '',
            };
        }
    }
    return cells;
}

/**
 * Convert the grid's edit state into a bulk-upsert payload. Cells
 * are skipped when:
 *   - status === 'Absent' AND both clock fields are empty AND the
 *     cell was never in the original load (i.e. nothing to write).
 *
 * The BE caps the array at 500 rows, so the caller should warn the
 * user if `cells` × `days` × `employees` could exceed that — this
 * helper just clips silently on the client side.
 */
export function buildBulkPayload(
    cells: Record<string, IGridCell>,
    original: Record<string, IGridCell>,
): IBulkAttendanceRow[] {
    const out: IBulkAttendanceRow[] = [];
    for (const key of Object.keys(cells)) {
        const cell = cells[key];
        const prior = original[key];
        const sameStatus = prior?.status === cell.status;
        const sameIn = (prior?.checkInTime ?? '') === cell.checkInTime;
        const sameOut = (prior?.checkOutTime ?? '') === cell.checkOutTime;
        if (sameStatus && sameIn && sameOut) {
            continue;
        }
        const row: IBulkAttendanceRow = {
            employeeId: cell.employeeId,
            attendanceDate: cell.attendanceDate,
            status: cell.status,
        };
        if (cell.checkInTime) row.checkInTime = cell.checkInTime;
        if (cell.checkOutTime) row.checkOutTime = cell.checkOutTime;
        out.push(row);
    }
    return out;
}

/** Status options surfaced in every cell. */
export const STATUS_OPTIONS: ReadonlyArray<{
    value: AttendanceStatus;
    label: string;
}> = [
    { value: 'Present', label: 'Present' },
    { value: 'Absent', label: 'Absent' },
    { value: 'Half_Day', label: 'Half day' },
    { value: 'Leave', label: 'Leave' },
    { value: 'Holiday', label: 'Holiday' },
    { value: 'Weekend', label: 'Weekend' },
];

/**
 * Statuses for which check-in / check-out clock times are meaningful.
 * Other statuses (Absent / Leave / Holiday / Weekend) hide the time
 * inputs in the editor and force the times to empty on save.
 */
export function statusUsesTimes(status: AttendanceStatus): boolean {
    return status === 'Present' || status === 'Half_Day';
}

/** Statuses for which manually entered duration hours are meaningful. */
export function statusUsesDuration(status: AttendanceStatus): boolean {
    return status === 'Present' || status === 'Half_Day';
}

/**
 * Chunk a month into a Mon-Sun calendar grid. Leading and trailing
 * cells outside the month are returned as `null` so callers can fade
 * them. Always returns 6 rows of 7 for a stable, non-jumping layout.
 */
export function monthWeeks(year: number, month: number): (string | null)[][] {
    const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0 = Sun … 6 = Sat
    // Mon-start offset: Monday → 0, Sunday → 6.
    const leading = (firstWeekday + 6) % 7;
    const days = monthDays(year, month);
    const cells: (string | null)[] = [];
    for (let i = 0; i < leading; i += 1) cells.push(null);
    cells.push(...days);
    while (cells.length < 42) cells.push(null);
    const rows: (string | null)[][] = [];
    for (let i = 0; i < 6; i += 1) {
        rows.push(cells.slice(i * 7, i * 7 + 7));
    }
    return rows;
}

/**
 * Render decimal hours as a compact duration label.
 *   7.92 → "7.9h"     8 → "8h"     null → "—"
 * Anything under 0.05 collapses to "—" to avoid the misleading "0h".
 */
export function formatHoursDuration(totalHours: number | null): string {
    if (totalHours == null || totalHours < 0.05) return '—';
    if (Math.abs(totalHours - Math.round(totalHours)) < 0.05) {
        return `${Math.round(totalHours)}h`;
    }
    return `${totalHours.toFixed(1)}h`;
}

/** Shift a YYYY-MM value by `delta` months (positive or negative). */
export function shiftIsoMonth(value: string, delta: number): string {
    const { year, month } = parseIsoMonth(value);
    const total = year * 12 + (month - 1) + delta;
    const ny = Math.floor(total / 12);
    const nm = (total % 12) + 1;
    return formatIsoMonth(ny, nm);
}

/** Shift a YYYY-MM-DD value by `deltaDays` (positive or negative). */
export function shiftIsoDate(value: string, deltaDays: number): string {
    const [y, m, d] = value.split('-').map(Number);
    return formatIsoDate(new Date(y, m - 1, d + deltaDays));
}
