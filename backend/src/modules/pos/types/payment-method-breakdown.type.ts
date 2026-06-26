import { PaymentMethod } from '@common/enums/payment-method';

/**
 * One slice of the "Sales by Payment Method" donut: total money and the
 * transaction count taken by a single tender (cash / card / mobile / online)
 * over the dashboard window.
 */
export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  total: number;
  count: number;
}
