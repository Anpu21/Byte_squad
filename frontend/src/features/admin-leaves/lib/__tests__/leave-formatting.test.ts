import { describe, expect, it } from 'vitest';
import {
    formatLeaveType,
    inclusiveDays,
    leaveStatusTone,
} from '../leave-formatting';

describe('leave-formatting', () => {
    it('replaces underscores in compound leave types', () => {
        expect(formatLeaveType('No_Pay')).toBe('No Pay');
        expect(formatLeaveType('Annual')).toBe('Annual');
    });

    it('maps leave status to expected pill tone', () => {
        expect(leaveStatusTone('Pending')).toBe('warning');
        expect(leaveStatusTone('Approved')).toBe('success');
        expect(leaveStatusTone('Rejected')).toBe('danger');
        expect(leaveStatusTone('Cancelled')).toBe('neutral');
    });

    it('inclusiveDays returns +1 of the date diff and 0 on bad input', () => {
        expect(inclusiveDays('2026-06-01', '2026-06-03')).toBe(3);
        expect(inclusiveDays('2026-06-01', '2026-06-01')).toBe(1);
        expect(inclusiveDays('', '2026-06-01')).toBe(0);
        expect(inclusiveDays('2026-06-05', '2026-06-01')).toBe(0);
    });
});
