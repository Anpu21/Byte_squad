import type { LeaveType } from './leave.type';

/**
 * Request body for `POST /hr/leaves`. Omit `employeeId` for
 * self-apply — the BE resolves the actor's own employee record.
 * Managers/admins may set it to apply on-behalf (branch-scoped).
 */
export interface IApplyLeavePayload {
    employeeId?: string;
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
