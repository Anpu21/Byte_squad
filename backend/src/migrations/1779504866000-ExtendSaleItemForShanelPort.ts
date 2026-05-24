import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds Shanel-port columns to `sale_items`:
 *   price_level_used, line_discount_percentage, line_subtotal,
 *   line_tax_rate, line_tax_amount, free, location_taken_from, status.
 *
 * All columns have safe defaults so existing rows survive without backfill.
 */
export class ExtendSaleItemForShanelPort1779504866000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE sale_items
        ADD COLUMN price_level_used varchar(32) NOT NULL DEFAULT 'Retail',
        ADD COLUMN line_discount_percentage decimal(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN line_subtotal decimal(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN line_tax_rate decimal(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN line_tax_amount decimal(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN free decimal(12,3) NOT NULL DEFAULT 0,
        ADD COLUMN location_taken_from varchar(64) NOT NULL DEFAULT 'Shop',
        ADD COLUMN status varchar(32) NOT NULL DEFAULT 'Active'
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE sale_items
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS location_taken_from,
        DROP COLUMN IF EXISTS free,
        DROP COLUMN IF EXISTS line_tax_amount,
        DROP COLUMN IF EXISTS line_tax_rate,
        DROP COLUMN IF EXISTS line_subtotal,
        DROP COLUMN IF EXISTS line_discount_percentage,
        DROP COLUMN IF EXISTS price_level_used
    `);
  }
}
