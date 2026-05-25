import type { PillTone } from '@/components/ui/Pill';
import type { LeaveStatus, LeaveType } from '@/types';

export const LEAVE_TYPES: ReadonlyArray<LeaveType> = [
    'Annual',
    'Sick',
    'Casual',
    'No_Pay',
    'Maternity',
    'Paternity',
];

export const LEAVE_STATUSES: ReadonlyArray<LeaveStatus> = [
    'Pending',
    'Approved',
    'Rejected',
    'Cancelled',
];

const STATUS_TONE: Record<LeaveStatus, PillTone> = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'danger',
    Cancelled: 'neutral',
};

export function leaveStatusTone(status: LeaveStatus): PillTone {
    return STATUS_TONE[status];
}

export function formatLeaveType(type: LeaveType): string {
    return type.replace('_', ' ');
}

/**
 * Inclusive day-count given two ISO `YYYY-MM-DD` strings. Returns
 * 0 when either side is empty or invalid. Used only as a helpful
 * default — the user can override with half-day or multi-day overrides
 * in the apply form before submit.
 */
export function inclusiveDays(start: string, end: string): number {
    if (!start || !end) return 0;
    const a = new Date(start);
    const b = new Date(end);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    const ms = b.getTime() - a.getTime();
    if (ms < 0) return 0;
    return Math.round(ms / 86_400_000) + 1;
}
