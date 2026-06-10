import { Injectable } from '@nestjs/common';
import { FinancialReportsRepository } from '@accounting/financial-reports.repository';
import { accountBalance } from '@accounting/lib/account-balance';
import type {
  BalanceSheetReport,
  DayBookReport,
  TrialBalanceReport,
} from '@accounting/types/financial-report-row.type';

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * The three classic statements over the account-dimensioned ledger:
 *
 * - Trial balance: raw Σdebits/Σcredits per account (+ an "unmapped"
 *   bucket for pre-chart rows) — the equality check proves the books.
 * - Balance sheet: signed natural balances as of a date; Income−Expense
 *   rolls into equity as virtual retained earnings, so it balances
 *   without a period-close process.
 * - Day book: every posting of one calendar day, oldest first.
 */
@Injectable()
export class FinancialReportsService {
  constructor(private readonly reports: FinancialReportsRepository) {}

  async trialBalance(
    branchId: string | null,
    startDate?: string,
    endDate?: string,
  ): Promise<TrialBalanceReport> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? this.endOfDay(new Date(endDate)) : undefined;
    const [sums, unmapped] = await Promise.all([
      this.reports.accountSums({ branchId, start, end }),
      this.reports.unmappedSums({ branchId, start, end }),
    ]);

    const rows = sums.map((s) => ({
      accountCode: s.code,
      accountName: s.name,
      accountType: s.type,
      debits: round2(s.debits),
      credits: round2(s.credits),
    }));
    const totalDebits = round2(
      rows.reduce((sum, r) => sum + r.debits, 0) + unmapped.debits,
    );
    const totalCredits = round2(
      rows.reduce((sum, r) => sum + r.credits, 0) + unmapped.credits,
    );
    return {
      rows,
      unmappedDebits: round2(unmapped.debits),
      unmappedCredits: round2(unmapped.credits),
      totalDebits,
      totalCredits,
      balanced: totalDebits === totalCredits,
    };
  }

  async balanceSheet(
    branchId: string | null,
    asOf?: string,
  ): Promise<BalanceSheetReport> {
    const asOfDate = asOf ? new Date(asOf) : new Date();
    const sums = await this.reports.accountSums({
      branchId,
      end: this.endOfDay(asOfDate),
    });

    const lines = sums.map((s) => ({
      type: s.type,
      line: {
        accountCode: s.code,
        accountName: s.name,
        balance: accountBalance(s.type, s.debits, s.credits),
      },
    }));
    const section = (type: string) =>
      lines.filter((l) => l.type === type).map((l) => l.line);

    const assets = section('Asset');
    const liabilities = section('Liability');
    const equity = section('Equity');
    const income = section('Income');
    const expenses = section('Expense');

    const sum = (rows: { balance: number }[]) =>
      round2(rows.reduce((s, r) => s + r.balance, 0));

    const retainedEarnings = round2(sum(income) - sum(expenses));
    const totalAssets = sum(assets);
    const totalLiabilities = sum(liabilities);
    const totalEquity = round2(sum(equity) + retainedEarnings);

    return {
      asOf: asOfDate.toISOString().slice(0, 10),
      assets,
      liabilities,
      equity,
      retainedEarnings,
      totalAssets,
      totalLiabilities,
      totalEquity,
      balanced: totalAssets === round2(totalLiabilities + totalEquity),
    };
  }

  async dayBook(
    branchId: string | null,
    date?: string,
  ): Promise<DayBookReport> {
    const day = date ? new Date(date) : new Date();
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = this.endOfDay(day);

    const raw = await this.reports.dayEntries(branchId, start, end);
    const rows = raw.map((r) => ({
      id: r.id,
      createdAt: new Date(r.created_at).toISOString(),
      entryType: r.entry_type,
      amount: Number(r.amount),
      description: r.description,
      referenceNumber: r.reference_number,
      accountCode: r.account_code,
      accountName: r.account_name,
    }));
    return {
      date: day.toISOString().slice(0, 10),
      rows,
      totalDebits: round2(
        rows
          .filter((r) => r.entryType === 'debit')
          .reduce((s, r) => s + r.amount, 0),
      ),
      totalCredits: round2(
        rows
          .filter((r) => r.entryType === 'credit')
          .reduce((s, r) => s + r.amount, 0),
      ),
    };
  }

  private endOfDay(d: Date): Date {
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}
