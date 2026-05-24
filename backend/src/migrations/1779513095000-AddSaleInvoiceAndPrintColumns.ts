import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds invoice-number and bill-print tracking columns to `sales`:
 *   invoice_number     varchar UNIQUE NOT NULL — the cashier-facing receipt
 *                      number (INV-YYYY-NNNNNN format) issued atomically by
 *                      InvoiceNumberService.next() at sale time. Existing rows
 *                      are backfilled with their `transaction_number` so the
 *                      UNIQUE constraint survives.
 *   bill_printed       boolean DEFAULT false — true once the receipt has been
 *                      printed at least once.
 *   bill_print_count   int     DEFAULT 0     — incremented each time the bill
 *                      is reprinted.
 *   first_print_date   timestamp NULL        — timestamp of the first print.
 *   last_print_date    timestamp NULL        — timestamp of the most recent
 *                      print.
 *
 * Strategy for invoice_number on a populated table:
 *   1. ADD COLUMN as nullable, no UNIQUE.
 *   2. Backfill from `transaction_number` (already unique).
 *   3. ALTER to NOT NULL and add the UNIQUE constraint.
 *
 * Reversible: down() drops the five columns (and the UNIQUE constraint).
 */
export class AddSaleInvoiceAndPrintColumns1779513095000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE sales
        ADD COLUMN IF NOT EXISTS invoice_number varchar,
        ADD COLUMN IF NOT EXISTS bill_printed boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS bill_print_count integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS first_print_date timestamp NULL,
        ADD COLUMN IF NOT EXISTS last_print_date timestamp NULL
    `);
    await qr.query(`
      UPDATE sales
      SET invoice_number = transaction_number
      WHERE invoice_number IS NULL
    `);
    await qr.query(`
      ALTER TABLE sales
        ALTER COLUMN invoice_number SET NOT NULL
    `);
    await qr.query(`
      ALTER TABLE sales
        ADD CONSTRAINT uq_sales_invoice_number UNIQUE (invoice_number)
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE sales
        DROP CONSTRAINT IF EXISTS uq_sales_invoice_number
    `);
    await qr.query(`
      ALTER TABLE sales
        DROP COLUMN IF EXISTS last_print_date,
        DROP COLUMN IF EXISTS first_print_date,
        DROP COLUMN IF EXISTS bill_print_count,
        DROP COLUMN IF EXISTS bill_printed,
        DROP COLUMN IF EXISTS invoice_number
    `);
  }
}
