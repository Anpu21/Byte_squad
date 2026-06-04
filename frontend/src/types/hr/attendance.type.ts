/**
 * Daily attendance row as returned by `GET /hr/attendance` and the
 * bulk / self check-in endpoints. Mirrors the `attendance` entity on
 * the backend: one row per `(employeeId, attendanceDate)` enforced by
 * the composite unique constraint.
 *
 * Time-of-day fields (`checkInTime`, `checkOutTime`,
 * `workingHoursStart` on the employee) come through as `HH:mm:ss`
 * strings, not full timestamps — the date lives on `attendanceDate`.
 */
export type AttendanceStatus =
    | 'Present'
    | 'Absent'
    | 'Half_Day'
    | 'Leave'
    | 'Holiday'
    | 'Weekend';

export type AttendanceMarkedBy =
    | 'Cashier_Self'
    | 'Manual'
    | 'Admin'
    | 'System';

export interface IAttendance {
    id: string;
    employeeId: string;
    /** ISO date `YYYY-MM-DD`. */
    attendanceDate: string;
    /** `HH:mm:ss` 24-hour, null when not yet checked in. */
    checkInTime: string | null;
    /** `HH:mm:ss` 24-hour, null when not yet checked out. */
    checkOutTime: string | null;
    /** Decimal hours worked, null until both check-in/out exist. */
    totalHours: number | null;
    status: AttendanceStatus;
    isLate: boolean;
    lateMinutes: number;
    isOvertime: boolean;
    overtimeHours: number;
    markedBy: AttendanceMarkedBy;
    cardsProduced: number;
    notes: string | null;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
}
