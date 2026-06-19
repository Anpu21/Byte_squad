import { describe, expect, it } from 'vitest';
import {
    formatLkr,
    formatPaymentMethod,
    formatPayPeriod,
    payrollStatusTone,
} from '../payroll-formatting';

describe('payroll-formatting', () => {
    it('maps payroll status to expected pill tone', () => {
        expect(payrollStatusTone('Pending')).toBe('warning');
        expect(payrollStatusTone('Approved')).toBe('info');
        expect(payrollStatusTone('Paid')).toBe('success');
        expect(payrollStatusTone('Cancelled')).toBe('neutral');
    });

    it('formats payment method labels', () => {
        expect(formatPaymentMethod('Cash')).toBe('Cash');
        expect(formatPaymentMethod('Card')).toBe('Card');
    });

    it('formats LKR currency with 2 decimal places and the LKR symbol', () => {
        const formatted = formatLkr(12345.6);
        expect(formatted).toMatch(/12,345\.60/);
        expect(formatLkr(null)).toBe('—');
        expect(formatLkr(undefined)).toBe('—');
    });

    it('formatPayPeriod returns Month YYYY for valid month/year', () => {
        expect(formatPayPeriod(6, 2026)).toBe('June 2026');
        expect(formatPayPeriod(0, 0)).toBe('');
    });
});
