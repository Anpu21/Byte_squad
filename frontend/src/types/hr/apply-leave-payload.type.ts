import type { LeaveType } from './leave.type';

/**
 * Request body for `POST /hr/leaves`. Cashiers cannot widen the
 * `employeeId` — the BE forces it to the actor's own employee.
 */
export interface IApplyLeavePayload {
    employeeId: string;
    leaveType: LeaveType;
    /** ISO date `YYYY-MM-DD`. */
    startDate: string;
    /** ISO date `YYYY-MM-DD`. */
    endDate: string;
    /** Min 0.5 (half-day), max 366. */
    totalDays: number;
    reason?: string;
    notes?: string;
}
