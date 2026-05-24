/**
 * Admin-list projection of a single loyalty wallet, normalized across
 * the polymorphic `users` and `loyalty_customers` owner tables.
 *
 * The shape is produced by `LoyaltyRepository.listCustomerAccounts` and
 * passed straight through to the admin loyalty controller; nullable
 * fields reflect the real-world gaps in the two identity sources (walk-
 * ins have no email, online users may not have a phone, an account with
 * no ledger activity has no last-activity branch, etc.).
 */
export interface LoyaltyCustomerRow {
  /**
   * Polymorphic identity: `userId` for online customers,
   * `loyaltyCustomerId` for walk-ins. Always set, unique per wallet,
   * used as the table key and as the route-param for the history
   * modal (walk-in history routing lands in a later phase).
   */
  id: string;
  /** Discriminates which polymorphic owner column is set on the wallet. */
  ownerType: 'user' | 'walkIn';
  /** Set when `ownerType === 'user'`; null for walk-ins. */
  userId: string | null;
  /** Set when `ownerType === 'walkIn'`; null for online users. */
  loyaltyCustomerId: string | null;
  firstName: string;
  /** Walk-ins may not have a last name. */
  lastName: string | null;
  /** Walk-ins have no email. */
  email: string | null;
  /** Users may not have a phone. */
  phone: string | null;
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  /** Falls back to `acc.updated_at` when the ledger is empty. */
  lastActivityAt: Date | null;
  /** Branch id of the most-recent ledger entry; null for online-only activity. */
  lastActivityBranchId: string | null;
  /** Branch name for `lastActivityBranchId`; null when the branch is null. */
  lastActivityBranchName: string | null;
}
