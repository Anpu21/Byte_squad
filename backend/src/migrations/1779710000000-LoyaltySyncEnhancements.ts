import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds Cargills-style loyalty sync primitives:
 *   * sale-level walk-in loyalty owner for later void/reversal.
 *   * redemption reserve and tier thresholds on loyalty settings.
 *   * ledger entry types for earn reversal and physical-to-online merges.
 */
export class LoyaltySyncEnhancements1779710000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TYPE loyalty_ledger_entries_type_enum
        ADD VALUE IF NOT EXISTS 'earn_reversed'
    `);

    await qr.query(`
      ALTER TYPE loyalty_ledger_entries_type_enum
        ADD VALUE IF NOT EXISTS 'merge_transfer'
    `);

    await qr.query(`
      ALTER TABLE loyalty_settings
        ADD COLUMN IF NOT EXISTS min_redeemable_points integer NOT NULL DEFAULT 100,
        ADD COLUMN IF NOT EXISTS silver_tier_points integer NOT NULL DEFAULT 1000,
        ADD COLUMN IF NOT EXISTS gold_tier_points integer NOT NULL DEFAULT 5000
    `);

    await qr.query(`
      ALTER TABLE sales
        ADD COLUMN IF NOT EXISTS loyalty_customer_id uuid
    `);

    await qr.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_sales_loyalty_customer'
        ) THEN
          ALTER TABLE sales
            ADD CONSTRAINT fk_sales_loyalty_customer
            FOREIGN KEY (loyalty_customer_id)
            REFERENCES loyalty_customers(id)
            ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_loyalty_customer_id
        ON sales (loyalty_customer_id)
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      DROP INDEX IF EXISTS idx_sales_loyalty_customer_id
    `);

    await qr.query(`
      ALTER TABLE sales
        DROP CONSTRAINT IF EXISTS fk_sales_loyalty_customer
    `);

    await qr.query(`
      ALTER TABLE sales
        DROP COLUMN IF EXISTS loyalty_customer_id
    `);

    await qr.query(`
      ALTER TABLE loyalty_settings
        DROP COLUMN IF EXISTS gold_tier_points,
        DROP COLUMN IF EXISTS silver_tier_points,
        DROP COLUMN IF EXISTS min_redeemable_points
    `);
  }
}
