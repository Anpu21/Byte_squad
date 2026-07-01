import type { CustomerStatus } from './customer-status.type';
import type { CustomerType } from './customer-type.type';

/** One unified row in the customers directory (the phone-stitched identity). */
export interface CustomerSummary {
  customerKey: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  /** Which source record(s) this stitched customer is made of. */
  types: CustomerType[];
  homeBranchId: string | null;
  homeBranchName: string | null;
  loyaltyPoints: number;
  /** Total owed across khata + registered receivables. */
  creditBalance: number;
  ordersCount: number;
  lifetimeSpend: number;
  lastSeenAt: string | null;
  tags: string[];
  status: CustomerStatus;
}
