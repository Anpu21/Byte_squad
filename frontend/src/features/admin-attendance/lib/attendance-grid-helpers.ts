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
