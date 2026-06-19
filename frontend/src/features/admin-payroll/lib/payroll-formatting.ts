import type { PillTone } from '@/components/ui/Pill';
import type { PaymentMethod, PayrollStatus } from '@/types';

export const PAYROLL_STATUSES: ReadonlyArray<PayrollStatus> = [
    'Pending',
    'Approved',
    'Paid',
    'Cancelled',
];

export const PAYMENT_METHODS: ReadonlyArray<PaymentMethod> = ['Cash', 'Card'];

const STATUS_TONE: Record<PayrollStatus, PillTone> = {
    Pending: 'warning',
    Approved: 'info',
    Paid: 'success',
    Cancelled: 'neutral',
};

export function payrollStatusTone(status: PayrollStatus): PillTone {
    return STATUS_TONE[status];
}

export function formatPaymentMethod(method: PaymentMethod): string {
    return method;
}

const LKR = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/** Money formatter for payroll columns — LKR with thousands separators. */
export function formatLkr(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '—';
    return LKR.format(Number(amount));
}

const MONTH_FMT = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
});

export function formatPayPeriod(month: number, year: number): string {
    if (!month || !year) return '';
    return MONTH_FMT.format(new Date(year, month - 1, 1));
}

/**
 * Trigger a browser download for a Blob (used by the CSV export).
 * Object-URL lifecycle is fully self-contained — no caller cleanup.
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
