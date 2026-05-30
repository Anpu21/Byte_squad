/**
 * Employee leave row as returned by `GET /hr/leaves`. Mirrors the
 * `employee_leaves` entity on the backend. Half-day leaves are
 * supported via the 0.5-day floor on `totalDays` (decimal(4,1)).
 */
export type LeaveType =
    | 'Annual'
    | 'Sick'
    | 'Casual'
    | 'No_Pay'
    | 'Maternity'
    | 'Paternity';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface ILeave {
    id: string;
    employeeId: string;
    leaveType: LeaveType;
    /** ISO date `YYYY-MM-DD`, inclusive. */
    startDate: string;
    /** ISO date `YYYY-MM-DD`, inclusive. */
    endDate: string;
    /** Decimal days; min 0.5 for half-day, max 366 (leap year). */
    totalDays: number;
    reason: string | null;
    notes: string | null;
    status: LeaveStatus;
    appliedDate: string;
    approvedBy: string | null;
    approvedDate: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
}
