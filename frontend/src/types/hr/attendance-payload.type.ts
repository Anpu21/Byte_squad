import type { AttendanceStatus } from './attendance.type';

/**
 * Single row inside the manager bulk-grid submission. Mirrors
 * `BulkAttendanceRowDto` on the backend — time fields are clock-times
 * (`HH:mm` or `HH:mm:ss`), not full timestamps.
 */
export interface IBulkAttendanceRow {
    employeeId: string;
    /** ISO date `YYYY-MM-DD`. */
    attendanceDate: string;
    status: AttendanceStatus;
    /** Optional `HH:mm[:ss]` clock-time. */
    checkInTime?: string;
    /** Optional `HH:mm[:ss]` clock-time. */
    checkOutTime?: string;
    /** Optional decimal duration in hours. */
    totalHours?: number;
    isOvertime?: boolean;
    overtimeHours?: number;
    cardsProduced?: number;
    notes?: string;
}

/**
 * Manager bulk-grid submission. The BE caps the array at 500 rows so
 * the upsert transaction stays bounded — a typical branch's monthly
 * grid is well under that.
 */
export interface IBulkAttendancePayload {
    rows: IBulkAttendanceRow[];
}
