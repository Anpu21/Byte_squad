import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the `base_unit` column to `products`:
 *   base_unit  varchar(32) NOT NULL DEFAULT 'unit' — the canonical unit of
 *              measure used when no per-product sellable unit row exists
 *              (and as the "isBase" anchor when they do). Defaults to 'unit'
 *              so the existing single-unit products keep their current
 *              behaviour without any data migration.
 *
 * Safe default means existing rows survive without backfill.
 * Reversible: down() drops the column.
 */
export class AddProductBaseUnit1779513096000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS base_unit varchar(32) NOT NULL DEFAULT 'unit'
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE products
        DROP COLUMN IF EXISTS base_unit
    `);
  }
}
