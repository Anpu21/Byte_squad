import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `stock_movements` audit log. Every inventory delta from a
 * sale, void, purchase, transfer, adjustment, or return writes a row.
 *
 * Constraints:
 *   product_id           FK -> products(id)  ON DELETE RESTRICT
 *   branch_id            FK -> branches(id)  ON DELETE RESTRICT
 *   created_by_user_id   FK -> users(id)     ON DELETE RESTRICT
 *   ref_type/ref_id      polymorphic reference back to the originating row
 *
 * Indexes:
 *   (product_id, branch_id) — per-branch product timelines
 *   (ref_type, ref_id)      — find every delta for a given sale/transfer
 *   (created_at DESC)       — recent activity feed
 */
export class CreateStockMovements1779504869000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE stock_movements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        location varchar(64) NOT NULL DEFAULT 'Shop',
        movement_type varchar(32) NOT NULL,
        qty_in decimal(12,3) NOT NULL DEFAULT 0,
        qty_out decimal(12,3) NOT NULL DEFAULT 0,
        balance_after decimal(12,3) NOT NULL,
        ref_type varchar(32) NULL,
        ref_id uuid NULL,
        notes varchar(255) NULL,
        created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await qr.query(
      `CREATE INDEX idx_sm_product_branch ON stock_movements (product_id, branch_id)`,
    );
    await qr.query(
      `CREATE INDEX idx_sm_ref ON stock_movements (ref_type, ref_id)`,
    );
    await qr.query(
      `CREATE INDEX idx_sm_created_at ON stock_movements (created_at DESC)`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_sm_created_at`);
    await qr.query(`DROP INDEX IF EXISTS idx_sm_ref`);
    await qr.query(`DROP INDEX IF EXISTS idx_sm_product_branch`);
    await qr.query(`DROP TABLE IF EXISTS stock_movements`);
  }
}
