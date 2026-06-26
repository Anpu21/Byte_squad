/**
 * Branch "who hasn't been recorded today" snapshot from
 * `GET /hr/attendance/today-status`. Powers the manager's daily attendance
 * prompt — active employees with no attendance row yet today are `pending`.
 */
export interface ITodayAttendancePendingEntry {
    employeeId: string;
    employeeCode: string;
    fullName: string;
    role: string;
}

export interface ITodayAttendanceStatus {
    date: string;
    total: number;
    recorded: number;
    pendingCount: number;
    pending: ITodayAttendancePendingEntry[];
}
