import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `payments` table that powers Shanel's multi-tender model.
 * One row per Sale; the row records the split across cash, card, mobile,
 * cheque, bank transfer, and store credit.
 *
 * - sale_id FK -> sales(id) ON DELETE CASCADE
 * - receipt_no is globally unique
 * - Indexes on sale_id and payment_method
 */
export class CreatePayments1779504867000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        receipt_no varchar(64) NOT NULL UNIQUE,
        payment_method varchar(32) NOT NULL,
        payment_amount decimal(12,2) NOT NULL,
        invoice_total decimal(12,2) NOT NULL,
        cash_tendered decimal(12,2) NOT NULL DEFAULT 0,
        cash_amount decimal(12,2) NOT NULL DEFAULT 0,
        cash_change decimal(12,2) NOT NULL DEFAULT 0,
        cheque_amount decimal(12,2) NOT NULL DEFAULT 0,
        bank_transfer_amount decimal(12,2) NOT NULL DEFAULT 0,
        credit_amount decimal(12,2) NOT NULL DEFAULT 0,
        keep_balance boolean NOT NULL DEFAULT false,
        cheque_no varchar(64) NULL,
        cheque_date date NULL,
        cheque_bank varchar(128) NULL,
        cheque_branch varchar(128) NULL,
        cheque_delivered_by varchar(128) NULL,
        cheque_ref varchar(64) NULL,
        bank_ref varchar(64) NULL,
        status varchar(32) NOT NULL DEFAULT 'Active',
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX idx_payments_sale ON payments (sale_id)`);
    await qr.query(
      `CREATE INDEX idx_payments_method ON payments (payment_method)`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_payments_method`);
    await qr.query(`DROP INDEX IF EXISTS idx_payments_sale`);
    await qr.query(`DROP TABLE IF EXISTS payments`);
  }
}
