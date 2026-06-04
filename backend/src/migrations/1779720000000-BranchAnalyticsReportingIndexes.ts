import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds covering indexes for branch analytics comparisons. These are
 * intentionally idempotent because some local databases may already
 * have equivalent indexes from manual SQL migration runs.
 */
export class BranchAnalyticsReportingIndexes1779720000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_branch_created_status_type
        ON sales (branch_id, created_at, status, type)
    `);

    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_sale_method_status
        ON payments (sale_id, payment_method, status)
    `);

    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_orders_branch_created_status_mode
        ON customer_orders (branch_id, created_at, status, payment_mode)
    `);

    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_branch_created_type
        ON loyalty_ledger_entries (branch_id, created_at, type)
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      DROP INDEX IF EXISTS idx_loyalty_ledger_branch_created_type
    `);

    await qr.query(`
      DROP INDEX IF EXISTS idx_customer_orders_branch_created_status_mode
    `);

    await qr.query(`
      DROP INDEX IF EXISTS idx_payments_sale_method_status
    `);

    await qr.query(`
      DROP INDEX IF EXISTS idx_sales_branch_created_status_type
    `);
  }
}
