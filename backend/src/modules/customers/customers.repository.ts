import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionType } from '@common/enums/transaction.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import type { CustomerType } from '@/modules/customers/types/customer-type.type';

export interface CustomerRosterParams {
  branchId: string | null;
  search?: string;
  type: CustomerType | 'all';
  status?: string;
  segment?: string;
  tag?: string;
  sort: 'name' | 'newest';
  limit: number;
  skip: number;
}

export interface CustomerRosterRow {
  customerKey: string;
  types: CustomerType[];
  userIds: string[];
  loyaltyIds: string[];
  creditIds: string[];
  displayName: string;
  email: string | null;
  phone: string | null;
  homeBranchId: string | null;
  homeBranchName: string | null;
  loyaltyPoints: number;
  creditBalance: number;
  status: string;
  tags: string[];
}

export interface SalesRollup {
  ordersCount: number;
  lifetimeSpend: number;
  lastSeenAt: string | null;
}

export interface SalesRollupMaps {
  byUser: Map<string, SalesRollup>;
  byLoyalty: Map<string, SalesRollup>;
  byCredit: Map<string, SalesRollup>;
}

interface RawRosterRow {
  customerKey: string;
  types: CustomerType[];
  userIds: string[] | null;
  loyaltyIds: string[] | null;
  creditIds: string[] | null;
  displayName: string;
  email: string | null;
  phone: string | null;
  homeBranchId: string | null;
  homeBranchName: string | null;
  loyaltyPoints: string | number | null;
  creditBalance: string | number | null;
  status: string;
  tags: unknown;
}

interface RawRollupRow {
  id: string;
  count: number;
  spend: string | number | null;
  last: Date | string | null;
}

/**
 * Read-side aggregation for the customer hub. Stitches the three disjoint
 * customer records (registered `users`, walk-in `loyalty_customers`, khata
 * `credit_accounts`) into one identity keyed by normalized phone (`94…`) or
 * `u:/lc:/ca:<id>` when the phone is missing/invalid. Kept in raw parameterized
 * SQL because the UNION + phone-normalization + grouping is awkward through the
 * QueryBuilder; every user-supplied value rides a positional bind ($n).
 */
@Injectable()
export class CustomersRepository {
  constructor(private readonly dataSource: DataSource) {}

  // SL-phone → bare-digit key (`94…`), mirroring `normalizeSriLankaPhone`.
  private phoneKey(col: string): string {
    return `CASE
      WHEN ${col} ~ '^\\+94[1-9][0-9]{8}$' THEN substring(${col} from 2)
      WHEN ${col} ~ '^0[1-9][0-9]{8}$' THEN '94' || substring(${col} from 2)
      WHEN ${col} ~ '^0094[1-9][0-9]{8}$' THEN substring(${col} from 3)
      ELSE NULL END`;
  }

  // Params: $1 role · $2 branchId · $3 search · $4 type · $5 status · $6 segment · $7 tag
  private baseCte(): string {
    return `
      WITH roster AS (
        SELECT
          COALESCE(${this.phoneKey('u.phone')}, 'u:' || u.id::text) AS customer_key,
          'registered'::text AS type,
          u.id::text AS source_id,
          NULLIF(trim(concat_ws(' ', u.first_name, u.last_name)), '') AS name,
          u.email AS email,
          u.phone AS phone,
          u.branch_id AS branch_id,
          u.current_balance AS balance,
          COALESCE(la.points_balance, 0) AS points,
          u.created_at AS created_at
        FROM users u
        LEFT JOIN loyalty_accounts la ON la.user_id = u.id
        WHERE u.role = $1
        UNION ALL
        SELECT
          COALESCE(${this.phoneKey('lc.phone')}, 'lc:' || lc.id::text),
          'walk-in', lc.id::text,
          NULLIF(trim(concat_ws(' ', lc.first_name, lc.last_name)), ''),
          NULL, lc.phone, lc.branch_id, 0,
          COALESCE(la.points_balance, 0),
          lc.created_at
        FROM loyalty_customers lc
        LEFT JOIN loyalty_accounts la ON la.loyalty_customer_id = lc.id
        UNION ALL
        SELECT
          COALESCE(${this.phoneKey('ca.phone')}, 'ca:' || ca.id::text),
          'khata', ca.id::text,
          ca.holder_name, NULL, ca.phone, ca.branch_id, ca.current_balance, 0,
          ca.created_at
        FROM credit_accounts ca
      ),
      grouped AS (
        SELECT
          customer_key,
          array_agg(DISTINCT type) AS types,
          COALESCE(array_agg(source_id) FILTER (WHERE type = 'registered'), ARRAY[]::text[]) AS user_ids,
          COALESCE(array_agg(source_id) FILTER (WHERE type = 'walk-in'), ARRAY[]::text[]) AS loyalty_ids,
          COALESCE(array_agg(source_id) FILTER (WHERE type = 'khata'), ARRAY[]::text[]) AS credit_ids,
          max(name) AS name,
          max(email) AS email,
          max(phone) AS phone,
          (array_agg(branch_id ORDER BY created_at) FILTER (WHERE branch_id IS NOT NULL))[1] AS home_branch_id,
          COALESCE(sum(balance), 0) AS credit_balance,
          COALESCE(sum(points), 0) AS loyalty_points,
          min(created_at) AS created_at
        FROM roster
        WHERE ($2::uuid IS NULL OR branch_id = $2::uuid)
        GROUP BY customer_key
        HAVING bool_or($3::text IS NULL OR name ILIKE $3 OR phone ILIKE $3 OR email ILIKE $3)
      ),
      final AS (
        SELECT
          g.customer_key AS "customerKey",
          g.types AS types,
          g.user_ids AS "userIds",
          g.loyalty_ids AS "loyaltyIds",
          g.credit_ids AS "creditIds",
          COALESCE(cp.display_name, g.name, g.phone, 'Customer') AS "displayName",
          g.email AS email,
          g.phone AS phone,
          g.home_branch_id AS "homeBranchId",
          b.name AS "homeBranchName",
          g.loyalty_points AS "loyaltyPoints",
          g.credit_balance AS "creditBalance",
          COALESCE(cp.status, 'active') AS status,
          COALESCE(cp.tags, '[]'::jsonb) AS tags,
          g.created_at AS created_at
        FROM grouped g
        LEFT JOIN customer_profiles cp ON cp.customer_key = g.customer_key
        LEFT JOIN branches b ON b.id = g.home_branch_id
        WHERE ($4::text = 'all' OR $4::text = ANY(g.types))
          AND ($5::text IS NULL OR COALESCE(cp.status, 'active') = $5::text)
          AND ($6::text IS NULL OR cp.segment = $6::text)
          AND ($7::text IS NULL OR cp.tags @> to_jsonb($7::text))
      )`;
  }

  async listRoster(
    params: CustomerRosterParams,
  ): Promise<{ rows: CustomerRosterRow[]; total: number }> {
    const filters = [
      UserRole.CUSTOMER,
      params.branchId,
      params.search ? `%${params.search}%` : null,
      params.type,
      params.status ?? null,
      params.segment ?? null,
      params.tag ?? null,
    ];

    const countRows = await this.dataSource.query<{ total: number }[]>(
      `${this.baseCte()} SELECT count(*)::int AS total FROM final`,
      filters,
    );
    const total = countRows[0]?.total ?? 0;

    const order =
      params.sort === 'newest'
        ? 'created_at DESC'
        : '"displayName" ASC NULLS LAST';
    const raw = await this.dataSource.query<RawRosterRow[]>(
      `${this.baseCte()} SELECT * FROM final ORDER BY ${order} LIMIT $8 OFFSET $9`,
      [...filters, params.limit, params.skip],
    );

    return { rows: raw.map((row) => this.mapRow(row)), total };
  }

  private mapRow(row: RawRosterRow): CustomerRosterRow {
    return {
      customerKey: row.customerKey,
      types: row.types ?? [],
      userIds: row.userIds ?? [],
      loyaltyIds: row.loyaltyIds ?? [],
      creditIds: row.creditIds ?? [],
      displayName: row.displayName,
      email: row.email,
      phone: row.phone,
      homeBranchId: row.homeBranchId,
      homeBranchName: row.homeBranchName,
      loyaltyPoints: Number(row.loyaltyPoints ?? 0),
      creditBalance: Number(row.creditBalance ?? 0),
      status: row.status,
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    };
  }

  /** Per-id sales rollups for the page, keyed by each identity column. */
  async salesRollups(ids: {
    userIds: string[];
    loyaltyIds: string[];
    creditIds: string[];
  }): Promise<SalesRollupMaps> {
    const run = async (
      column: 'customer_user_id' | 'loyalty_customer_id' | 'credit_account_id',
      values: string[],
    ): Promise<Map<string, SalesRollup>> => {
      if (values.length === 0) return new Map();
      const rows = await this.dataSource.query<RawRollupRow[]>(
        `SELECT ${column} AS id, count(*)::int AS count,
                COALESCE(sum(total), 0) AS spend, max(created_at) AS last
         FROM sales
         WHERE ${column} = ANY($1) AND type = $2 AND status <> 'Voided'
         GROUP BY ${column}`,
        [values, TransactionType.SALE],
      );
      return new Map(
        rows.map((r) => [
          r.id,
          {
            ordersCount: Number(r.count),
            lifetimeSpend: Number(r.spend ?? 0),
            lastSeenAt: r.last ? new Date(r.last).toISOString() : null,
          },
        ]),
      );
    };

    const [byUser, byLoyalty, byCredit] = await Promise.all([
      run('customer_user_id', ids.userIds),
      run('loyalty_customer_id', ids.loyaltyIds),
      run('credit_account_id', ids.creditIds),
    ]);
    return { byUser, byLoyalty, byCredit };
  }
}
