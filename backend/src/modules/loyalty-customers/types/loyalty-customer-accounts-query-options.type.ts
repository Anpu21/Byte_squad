/**
 * Options accepted by `LoyaltyRepository.listCustomerAccounts`.
 *
 * Filters semantics:
 *   - `branchId`       — EXISTS a ledger row at that branch
 *   - `activeSince`    — EXISTS a ledger row on/after the date
 *   - `branchId + activeSince` — both conditions in the same EXISTS
 *   - `minPoints` / `maxPoints` — range on `acc.points_balance`
 *
 * `search` is a case-insensitive substring match across name / email /
 * phone columns, COALESCEd across both polymorphic owner tables.
 */
export interface LoyaltyCustomerAccountsQueryOptions {
  search?: string;
  branchId?: string;
  activeSince?: string;
  minPoints?: number;
  maxPoints?: number;
  limit: number;
  offset: number;
}
