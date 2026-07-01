import type { SelectQueryBuilder } from 'typeorm';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import type {
  LoyaltyCustomerAccountsQueryOptions,
  LoyaltyCustomerRawRow,
  LoyaltyCustomerRow,
} from '@/modules/loyalty/types';

/**
 * Pushes the "any activity in branch / since date" EXISTS clause onto
 * the customer-accounts query. Extracted from `LoyaltyRepository` so
 * the repository file stays under the file-size cap; the SQL is
 * fundamentally a filter and has no other call sites.
 */
export function applyLedgerActivityExists(
  qb: SelectQueryBuilder<LoyaltyAccount>,
  opts: Pick<LoyaltyCustomerAccountsQueryOptions, 'branchId' | 'activeSince'>,
): void {
  const params: Record<string, unknown> = {};
  const conditions: string[] = [];
  if (opts.branchId) {
    conditions.push('le3.branch_id = :branchId');
    params.branchId = opts.branchId;
  }
  if (opts.activeSince) {
    conditions.push('le3.created_at >= :activeSince');
    params.activeSince = opts.activeSince;
  }
  const ledgerWhere = conditions.length
    ? ` AND ${conditions.join(' AND ')}`
    : '';
  const existsClause = `EXISTS (
      SELECT 1 FROM loyalty_ledger_entries le3
      WHERE (
        (le3.user_id IS NOT NULL AND le3.user_id = acc.user_id)
        OR (le3.loyalty_customer_id IS NOT NULL
            AND le3.loyalty_customer_id = acc.loyalty_customer_id)
      )${ledgerWhere}
    )`;

  // A walk-in whose HOME branch is the filtered branch should appear even with
  // no ledger activity yet (freshly enrolled) — but only when we are not also
  // constraining to an "active since" window, which requires real activity.
  if (opts.branchId && !opts.activeSince) {
    qb.andWhere(`(lc.branch_id = :branchId OR ${existsClause})`, params);
  } else {
    qb.andWhere(existsClause, params);
  }
}

/**
 * Coerces a raw query row to the strict `LoyaltyCustomerRow` shape:
 * driver-returned `string | number` numerics become `number`, and the
 * `undefined` columns left by missing rows on either side of the
 * COALESCEd polymorphic owner become `null`.
 */
export function normalizeCustomerRow(
  r: LoyaltyCustomerRawRow,
): LoyaltyCustomerRow {
  return {
    id: r.id,
    ownerType: r.ownerType,
    userId: r.userId ?? null,
    loyaltyCustomerId: r.loyaltyCustomerId ?? null,
    tier: 'bronze',
    firstName: r.firstName,
    lastName: r.lastName ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    pointsBalance: Number(r.pointsBalance),
    lifetimePointsEarned: Number(r.lifetimePointsEarned),
    lifetimePointsRedeemed: Number(r.lifetimePointsRedeemed),
    lastActivityAt: r.lastActivityAt ?? null,
    lastActivityBranchId: r.lastActivityBranchId ?? null,
    lastActivityBranchName: r.lastActivityBranchName ?? null,
  };
}
