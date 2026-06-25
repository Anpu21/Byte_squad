/**
 * Polymorphic loyalty wallet owner. Exactly one of `userId` or
 * `loyaltyCustomerId` is set at a time — never both, never neither.
 * This shape mirrors the `(user_id, loyalty_customer_id)` CHECK
 * constraint on `loyalty_accounts` / `loyalty_ledger_entries`.
 *
 * Use the `LoyaltyOwner` union when reading; use the discriminated
 * branches when writing so TypeScript will refuse a payload with
 * both columns set.
 */
export type LoyaltyOwner =
  | { userId: string; loyaltyCustomerId?: undefined }
  | { userId?: undefined; loyaltyCustomerId: string };
