import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds Shanel-port columns to `sales`:
 *   sale_type, price_level, discount_percentage, tax_rate,
 *   paid_amount, balance_due, payment_status, status, location,
 *   customer_user_id (FK -> users, ON DELETE SET NULL),
 *   voided_reason, voided_at, voided_by_user_id (FK -> users, ON DELETE SET NULL).
 *
 * All columns have safe defaults so existing rows survive without backfill.
 * Indexes added for status, payment_status, customer_user_id.
 */
export class ExtendSaleForShanelPort1779504865000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE sales
        ADD COLUMN sale_type varchar(32) NOT NULL DEFAULT 'Retail',
        ADD COLUMN price_level varchar(32) NOT NULL DEFAULT 'Retail',
        ADD COLUMN discount_percentage decimal(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN tax_rate decimal(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN paid_amount decimal(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN balance_due decimal(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN payment_status varchar(32) NOT NULL DEFAULT 'Unpaid',
        ADD COLUMN status varchar(32) NOT NULL DEFAULT 'Active',
        ADD COLUMN location varchar(64) NOT NULL DEFAULT 'Shop',
        ADD COLUMN customer_user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN voided_reason varchar(255) NULL,
        ADD COLUMN voided_at timestamp NULL,
        ADD COLUMN voided_by_user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL
    `);
    await qr.query(`CREATE INDEX idx_sales_status ON sales (status)`);
    await qr.query(
      `CREATE INDEX idx_sales_payment_status ON sales (payment_status)`,
    );
    await qr.query(
      `CREATE INDEX idx_sales_customer_user ON sales (customer_user_id)`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_sales_customer_user`);
    await qr.query(`DROP INDEX IF EXISTS idx_sales_payment_status`);
    await qr.query(`DROP INDEX IF EXISTS idx_sales_status`);
    await qr.query(`
      ALTER TABLE sales
        DROP COLUMN IF EXISTS voided_by_user_id,
        DROP COLUMN IF EXISTS voided_at,
        DROP COLUMN IF EXISTS voided_reason,
        DROP COLUMN IF EXISTS customer_user_id,
        DROP COLUMN IF EXISTS location,
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS payment_status,
        DROP COLUMN IF EXISTS balance_due,
        DROP COLUMN IF EXISTS paid_amount,
        DROP COLUMN IF EXISTS tax_rate,
        DROP COLUMN IF EXISTS discount_percentage,
        DROP COLUMN IF EXISTS price_level,
        DROP COLUMN IF EXISTS sale_type
    `);
  }
}
