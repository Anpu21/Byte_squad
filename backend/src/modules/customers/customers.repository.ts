import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionType } from '@common/enums/transaction.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import type { CustomerType } from '@/modules/customers/types/customer-type.type';
import type {
  CustomerAnalyticsRow,
  CustomerCreditAccountSummary,
  CustomerRecentOrder,
  CustomerRecentSale,
} from '@/modules/customers/types';

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
  notes: string | null;
  segment: string | null;
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
  notes: string | null;
  segment: string | null;
}

interface RawRecentSale {
  id: string;
  invoiceNumber: string;
  total: string | number | null;
  createdAt: Date | string;
  branchName: string | null;
}

interface RawRecentOrder {
  id: string;
  orderCode: string;
  status: string;
  finalTotal: string | number | null;
  createdAt: Date | string;
}

interface RawCreditAccountSummary {
  id: string;
  accountNo: string;
  status: string;
  currentBalance: string | number | null;
  creditLimit: string | number | null;
  branchName: string | null;
}

interface RawRollupRow {
  id: string;
  count: number;
  spend: string | number | null;
  last: Date | string | null;
}

interface RawAnalyticsRow {
  customerKey: string;
  displayName: string;
  createdAt: Date | string;
  orders: string | number | null;
  ltv: string | number | null;
  lastSeenAt: Date | string | null;
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
          COALESCE(
            CASE WHEN ca.user_id IS NOT NULL
              THEN COALESCE(${this.phoneKey('cu.phone')}, 'u:' || ca.user_id::text)
            END,
            ${this.phoneKey('ca.phone')},
            'ca:' || ca.id::text
          ),
          'khata', ca.id::text,
          ca.holder_name, NULL, ca.phone, ca.branch_id, ca.current_balance, 0,
          ca.created_at
        FROM credit_accounts ca
        LEFT JOIN users cu ON cu.id = ca.user_id
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
          cp.notes AS notes,
          cp.segment AS segment,
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
      notes: row.notes ?? null,
      segment: row.segment ?? null,
    };
  }

  /** The single stitched identity for a key (or null). Reuses the roster CTE. */
  async findIdentityByKey(
    key: string,
    branchId: string | null,
  ): Promise<CustomerRosterRow | null> {
    const rows = await this.dataSource.query<RawRosterRow[]>(
      `${this.baseCte()} SELECT * FROM final WHERE "customerKey" = $8 LIMIT 1`,
      [UserRole.CUSTOMER, branchId, null, 'all', null, null, null, key],
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async recentSales(
    ids: { userIds: string[]; loyaltyIds: string[]; creditIds: string[] },
    limit: number,
  ): Promise<CustomerRecentSale[]> {
    if (
      ids.userIds.length + ids.loyaltyIds.length + ids.creditIds.length ===
      0
    ) {
      return [];
    }
    const rows = await this.dataSource.query<RawRecentSale[]>(
      `SELECT s.id, s.invoice_number AS "invoiceNumber", s.total,
              s.created_at AS "createdAt", b.name AS "branchName"
       FROM sales s
       LEFT JOIN branches b ON b.id = s.branch_id
       WHERE s.type = $1 AND s.status <> 'Voided'
         AND (s.customer_user_id = ANY($2::uuid[])
              OR s.loyalty_customer_id = ANY($3::uuid[])
              OR s.credit_account_id = ANY($4::uuid[]))
       ORDER BY s.created_at DESC
       LIMIT $5`,
      [TransactionType.SALE, ids.userIds, ids.loyaltyIds, ids.creditIds, limit],
    );
    return rows.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoiceNumber,
      total: Number(r.total ?? 0),
      createdAt: new Date(r.createdAt).toISOString(),
      branchName: r.branchName,
    }));
  }

  async recentOrders(
    userIds: string[],
    limit: number,
  ): Promise<CustomerRecentOrder[]> {
    if (userIds.length === 0) return [];
    const rows = await this.dataSource.query<RawRecentOrder[]>(
      `SELECT id, order_code AS "orderCode", status,
              final_total AS "finalTotal", created_at AS "createdAt"
       FROM customer_orders
       WHERE user_id = ANY($1::uuid[])
       ORDER BY created_at DESC
       LIMIT $2`,
      [userIds, limit],
    );
    return rows.map((r) => ({
      id: r.id,
      orderCode: r.orderCode,
      status: r.status,
      finalTotal: Number(r.finalTotal ?? 0),
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  }

  async creditAccounts(
    creditIds: string[],
  ): Promise<CustomerCreditAccountSummary[]> {
    if (creditIds.length === 0) return [];
    const rows = await this.dataSource.query<RawCreditAccountSummary[]>(
      `SELECT ca.id, ca.account_no AS "accountNo", ca.status,
              ca.current_balance AS "currentBalance",
              ca.credit_limit AS "creditLimit", b.name AS "branchName"
       FROM credit_accounts ca
       LEFT JOIN branches b ON b.id = ca.branch_id
       WHERE ca.id = ANY($1::uuid[])
       ORDER BY ca.created_at DESC`,
      [creditIds],
    );
    return rows.map((r) => ({
      id: r.id,
      accountNo: r.accountNo,
      status: r.status,
      currentBalance: Number(r.currentBalance ?? 0),
      creditLimit: r.creditLimit == null ? null : Number(r.creditLimit),
      branchName: r.branchName,
    }));
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

  /**
   * Per-customer purchase aggregates for the whole in-scope roster (no
   * pagination — analytics needs the full population). Joins sales to each
   * stitched identity's source-id arrays; a customer with no sales rows still
   * appears (LEFT JOIN) so churn/prospect buckets are complete.
   */
  async analyticsRows(
    branchId: string | null,
  ): Promise<CustomerAnalyticsRow[]> {
    const rows = await this.dataSource.query<RawAnalyticsRow[]>(
      `${this.baseCte()},
       spc AS (
         SELECT f."customerKey",
                count(s.id)::int AS orders,
                COALESCE(sum(s.total), 0) AS ltv,
                max(s.created_at) AS last_seen
         FROM final f
         LEFT JOIN sales s ON s.type = $8 AND s.status <> 'Voided'
           AND (s.customer_user_id = ANY(f."userIds"::uuid[])
                OR s.loyalty_customer_id = ANY(f."loyaltyIds"::uuid[])
                OR s.credit_account_id = ANY(f."creditIds"::uuid[]))
         GROUP BY f."customerKey"
       )
       SELECT f."customerKey", f."displayName", f.created_at AS "createdAt",
              COALESCE(spc.orders, 0) AS orders,
              COALESCE(spc.ltv, 0) AS ltv,
              spc.last_seen AS "lastSeenAt"
       FROM final f
       LEFT JOIN spc ON spc."customerKey" = f."customerKey"`,
      [
        UserRole.CUSTOMER,
        branchId,
        null,
        'all',
        null,
        null,
        null,
        TransactionType.SALE,
      ],
    );
    return rows.map((r) => ({
      customerKey: r.customerKey,
      displayName: r.displayName,
      lifetimeSpend: Number(r.ltv ?? 0),
      ordersCount: Number(r.orders ?? 0),
      lastSeenAt: r.lastSeenAt ? new Date(r.lastSeenAt).toISOString() : null,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  }

  /** Re-point khata (credit) accounts onto a registered user during a merge. */
  async reassignCreditAccountsToUser(
    creditIds: string[],
    userId: string,
  ): Promise<void> {
    if (creditIds.length === 0) return;
    await this.dataSource.query(
      `UPDATE credit_accounts SET user_id = $2, loyalty_customer_id = NULL
       WHERE id = ANY($1::uuid[])`,
      [creditIds, userId],
    );
  }
}
