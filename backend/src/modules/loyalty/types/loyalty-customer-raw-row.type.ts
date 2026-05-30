/**
 * Raw-DB wire shape returned by `getRawMany` for the admin customer
 * list query. Mirrors `LoyaltyCustomerRow` but keeps numeric columns
 * as `string | number` because TypeORM surfaces aggregate / bigint
 * fields as strings depending on the underlying driver. The repository
 * normalizes these via `Number(...)` before returning rows to callers.
 */
export interface LoyaltyCustomerRawRow {
  id: string;
  ownerType: 'user' | 'walkIn';
  userId: string | null;
  loyaltyCustomerId: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  pointsBalance: string | number;
  lifetimePointsEarned: string | number;
  lifetimePointsRedeemed: string | number;
  lastActivityAt: Date | null;
  lastActivityBranchId: string | null;
  lastActivityBranchName: string | null;
}
