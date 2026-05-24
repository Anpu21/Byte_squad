import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds three Shanel-port columns to `products`:
 *   wholesale_price  decimal(12,2) DEFAULT 0 — separate price tier the POS
 *                    cashier can toggle to instead of selling_price (retail).
 *   tax_rate         decimal(5,2)  DEFAULT 0 — per-product VAT/GST percentage
 *                    used by the POS invoice-total calculator.
 *   discount_allowed boolean       DEFAULT true — when false the POS UI must
 *                    reject manual discounts on this line item.
 *
 * Safe defaults mean existing rows survive without backfill.
 * Reversible: down() drops the three columns.
 */
export class AddProductWholesaleAndTax1779513093000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE products
        ADD COLUMN wholesale_price decimal(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN tax_rate decimal(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN discount_allowed boolean NOT NULL DEFAULT true
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE products
        DROP COLUMN IF EXISTS discount_allowed,
        DROP COLUMN IF EXISTS tax_rate,
        DROP COLUMN IF EXISTS wholesale_price
    `);
  }
}
