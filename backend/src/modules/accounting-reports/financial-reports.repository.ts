import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { AccountType } from '@/modules/accounting-core/types/account-type.type';

export interface AccountSumsRaw {
  code: string;
  name: string;
  type: AccountType;
  debits: number;
  credits: number;
}

export interface UnmappedSumsRaw {
  debits: number;
  credits: number;
}

export interface DayBookRowRaw {
  id: string;
  created_at: string;
  entry_type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference_number: string;
  account_code: string | null;
  account_name: string | null;
}

interface WindowFilter {
  branchId: string | null;
  /** ISO date `YYYY-MM-DD`, inclusive. */
  start?: string;
  /** ISO date `YYYY-MM-DD`, inclusive. */
  end?: string;
}

/**
 * Read-only aggregates for the financial reports. Everything keys off
 * the account-dimensioned ledger, so journals and system postings are
 * indistinguishable here — exactly the point of the chokepoint.
 */
@Injectable()
export class FinancialReportsRepository {
  constructor(private readonly dataSource: DataSource) {}

  /** Per-account debit/credit sums over an optional window. */
  async accountSums(filter: WindowFilter): Promise<AccountSumsRaw[]> {
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (filter.branchId) {
      params.push(filter.branchId);
      conditions.push(`le.branch_id = $${params.length}`);
    }
    if (filter.start) {
      params.push(filter.start);
      conditions.push(`le.entry_date >= $${params.length}`);
    }
    if (filter.end) {
      params.push(filter.end);
      conditions.push(`le.entry_date <= $${params.length}`);
    }
    const joinFilter = conditions.length
      ? `AND ${conditions.join(' AND ')}`
      : '';

    const raw: Array<{
      code: string;
      name: string;
      type: AccountType;
      debits: string;
      credits: string;
    }> = await this.dataSource.query(
      `
      SELECT a.code, a.name, a.type,
        COALESCE(SUM(CASE WHEN le.entry_type = 'debit'
          THEN le.amount ELSE 0 END), 0) AS debits,
        COALESCE(SUM(CASE WHEN le.entry_type = 'credit'
          THEN le.amount ELSE 0 END), 0) AS credits
      FROM accounts a
      LEFT JOIN ledger_entries le
        ON le.account_id = a.id ${joinFilter}
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.code ASC
      `,
      params,
    );
    return raw.map((r) => ({
      code: r.code,
      name: r.name,
      type: r.type,
      debits: Number(r.debits),
      credits: Number(r.credits),
    }));
  }

  /** Pre-chart leftovers (account_id IS NULL) so totals stay honest. */
  async unmappedSums(filter: WindowFilter): Promise<UnmappedSumsRaw> {
    const params: unknown[] = [];
    const conditions: string[] = ['le.account_id IS NULL'];
    if (filter.branchId) {
      params.push(filter.branchId);
      conditions.push(`le.branch_id = $${params.length}`);
    }
    if (filter.start) {
      params.push(filter.start);
      conditions.push(`le.entry_date >= $${params.length}`);
    }
    if (filter.end) {
      params.push(filter.end);
      conditions.push(`le.entry_date <= $${params.length}`);
    }
    const raw: Array<{ debits: string; credits: string }> =
      await this.dataSource.query(
        `
      SELECT
        COALESCE(SUM(CASE WHEN le.entry_type = 'debit'
          THEN le.amount ELSE 0 END), 0) AS debits,
        COALESCE(SUM(CASE WHEN le.entry_type = 'credit'
          THEN le.amount ELSE 0 END), 0) AS credits
      FROM ledger_entries le
      WHERE ${conditions.join(' AND ')}
      `,
        params,
      );
    return {
      debits: Number(raw[0]?.debits ?? 0),
      credits: Number(raw[0]?.credits ?? 0),
    };
  }

  /** Every entry of one business day, oldest first, with its account. */
  async dayEntries(
    branchId: string | null,
    date: string,
  ): Promise<DayBookRowRaw[]> {
    const params: unknown[] = [date];
    let branchFilter = '';
    if (branchId) {
      params.push(branchId);
      branchFilter = `AND le.branch_id = $${params.length}`;
    }
    return this.dataSource.query(
      `
      SELECT le.id, le.created_at, le.entry_type, le.amount,
             le.description, le.reference_number,
             a.code AS account_code, a.name AS account_name
      FROM ledger_entries le
      LEFT JOIN accounts a ON a.id = le.account_id
      WHERE le.entry_date = $1 ${branchFilter}
      ORDER BY le.created_at ASC
      `,
      params,
    );
  }
}
