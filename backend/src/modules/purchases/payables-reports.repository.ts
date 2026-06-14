import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  PayablesAgeingRow,
  PayablesOutstandingRow,
} from '@/modules/purchases/types/payables-report-row.type';

interface OutstandingRaw {
  supplier_id: string;
  supplier_name: string;
  opening_balance: string;
  opening_settled: string;
  bills_total: string;
  bills_paid: string;
}

interface AgeingRaw {
  supplier_id: string;
  supplier_name: string;
  current: string;
  d1to30: string;
  d31to60: string;
  d61to90: string;
  d90plus: string;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Read-only payables aggregates. Suppliers are global, so both reports are
 * supplier-level across branches — the per-bill drill-down is served by the
 * GRN list endpoint with `paymentStatus` filters.
 */
@Injectable()
export class PayablesReportsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async outstanding(): Promise<PayablesOutstandingRow[]> {
    const raw: OutstandingRaw[] = await this.dataSource.query(`
      SELECT
        s.id AS supplier_id,
        s.name AS supplier_name,
        s.opening_balance,
        COALESCE(opening_paid.total, 0) AS opening_settled,
        COALESCE(bills.total, 0) AS bills_total,
        COALESCE(bills.paid, 0) AS bills_paid
      FROM suppliers s
      LEFT JOIN (
        SELECT p.supplier_id, SUM(a.amount) AS total
        FROM supplier_payment_allocations a
        JOIN supplier_payments p ON p.id = a.payment_id
        WHERE a.grn_id IS NULL
        GROUP BY p.supplier_id
      ) opening_paid ON opening_paid.supplier_id = s.id
      LEFT JOIN (
        SELECT g.supplier_id,
               SUM(g.grand_total) AS total,
               SUM(g.paid_amount) AS paid
        FROM grns g
        WHERE g.status = 'Received'
        GROUP BY g.supplier_id
      ) bills ON bills.supplier_id = s.id
      ORDER BY s.name ASC
    `);

    return raw.map((r) => {
      const openingBalance = Number(r.opening_balance);
      const openingSettled = Number(r.opening_settled);
      const billsTotal = Number(r.bills_total);
      const billsPaid = Number(r.bills_paid);
      const openingRemaining = round2(openingBalance - openingSettled);
      const billsOutstanding = round2(billsTotal - billsPaid);
      return {
        supplierId: r.supplier_id,
        supplierName: r.supplier_name,
        openingBalance,
        openingSettled,
        openingRemaining,
        billsTotal,
        billsPaid,
        billsOutstanding,
        totalOutstanding: round2(openingRemaining + billsOutstanding),
      };
    });
  }

  async ageing(): Promise<PayablesAgeingRow[]> {
    const raw: AgeingRaw[] = await this.dataSource.query(`
      SELECT
        g.supplier_id,
        s.name AS supplier_name,
        SUM(CASE WHEN g.due_date >= CURRENT_DATE
            THEN g.grand_total - g.paid_amount ELSE 0 END) AS current,
        SUM(CASE WHEN CURRENT_DATE - g.due_date BETWEEN 1 AND 30
            THEN g.grand_total - g.paid_amount ELSE 0 END) AS d1to30,
        SUM(CASE WHEN CURRENT_DATE - g.due_date BETWEEN 31 AND 60
            THEN g.grand_total - g.paid_amount ELSE 0 END) AS d31to60,
        SUM(CASE WHEN CURRENT_DATE - g.due_date BETWEEN 61 AND 90
            THEN g.grand_total - g.paid_amount ELSE 0 END) AS d61to90,
        SUM(CASE WHEN CURRENT_DATE - g.due_date > 90
            THEN g.grand_total - g.paid_amount ELSE 0 END) AS d90plus
      FROM grns g
      JOIN suppliers s ON s.id = g.supplier_id
      WHERE g.status = 'Received'
        AND g.grand_total > g.paid_amount
      GROUP BY g.supplier_id, s.name
      ORDER BY s.name ASC
    `);

    return raw.map((r) => {
      const current = Number(r.current);
      const d1to30 = Number(r.d1to30);
      const d31to60 = Number(r.d31to60);
      const d61to90 = Number(r.d61to90);
      const d90plus = Number(r.d90plus);
      return {
        supplierId: r.supplier_id,
        supplierName: r.supplier_name,
        current,
        d1to30,
        d31to60,
        d61to90,
        d90plus,
        total: round2(current + d1to30 + d31to60 + d61to90 + d90plus),
      };
    });
  }
}
