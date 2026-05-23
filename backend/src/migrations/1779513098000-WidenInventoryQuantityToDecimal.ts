import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Widens `inventory.quantity` from `integer` to `decimal(12,3)` so fractional
 * sales (loose produce typed in grams against a kg-stocked product, juice
 * typed in mL against a litre-stocked product) survive the round-trip from
 * `sale_items.base_unit_qty` (also decimal(12,3)) into the inventory ledger
 * without silent integer truncation.
 *
 * The `USING quantity::decimal(12,3)` clause is the standard Postgres
 * recipe for widening an integer column to decimal — existing integer
 * values cast cleanly with no precision loss.
 *
 * Reversible: down() narrows back to integer with `USING quantity::integer`,
 * which TRUNCATES the fractional part on rollback. Document this for ops:
 * rolling back after fractional sales have been recorded will lose the
 * sub-unit portion of every affected row.
 */
export class WidenInventoryQuantityToDecimal1779513098000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE inventory
        ALTER COLUMN quantity TYPE decimal(12,3) USING quantity::decimal(12,3)
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    // WARNING: this truncates the fractional part of every existing
    // inventory row. Only safe to run before any fractional sales.
    await qr.query(`
      ALTER TABLE inventory
        ALTER COLUMN quantity TYPE integer USING quantity::integer
    `);
  }
}
