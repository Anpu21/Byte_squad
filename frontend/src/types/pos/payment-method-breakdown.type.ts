import type { PaymentMethod } from '@/constants/enums';

/**
 * One slice of the "Sales by Payment Method" donut. Mirrors
 * `PaymentMethodBreakdown` on the backend.
 */
export interface IPaymentMethodBreakdown {
    method: PaymentMethod;
    total: number;
    count: number;
}
