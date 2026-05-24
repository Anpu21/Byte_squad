import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the per-line "base unit qty" + "sellable unit" columns to `sale_items`:
 *   base_unit_qty  decimal(12,3) NOT NULL — the line quantity converted into
 *                  the product's canonical base unit (e.g. 1000 g typed
 *                  against a kg-stocked product → 1.000 kg). Mirrors the
 *                  `inventory.quantity` scale so void/return flows can
 *                  reconstruct what the cashier rang up.
 *   unit_id        uuid NULL — which ProductSellableUnit row was selected
 *                  at the till. NULL when the line was rung in the product's
 *                  base unit directly. ON DELETE SET NULL because a unit
 *                  can be retired after the sale has been printed.
 *
 * Strategy for a populated table:
 *   1. ADD base_unit_qty as nullable.
 *   2. Backfill from `quantity` (pre-Phase-5 rows had no conversion, so
 *      the typed qty equals the base-unit qty).
 *   3. ALTER to NOT NULL.
 *   4. ADD unit_id with FK + index. NULL is fine for existing rows.
 *
 * Reversible: down() drops the index, the FK column, and the qty column.
 */
export class AddSaleItemBaseUnitQtyAndUnit1779513097000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE sale_items
        ADD COLUMN IF NOT EXISTS base_unit_qty decimal(12,3)
    `);
    await qr.query(`
      UPDATE sale_items
      SET base_unit_qty = quantity
      WHERE base_unit_qty IS NULL
    `);
    await qr.query(`
      ALTER TABLE sale_items
        ALTER COLUMN base_unit_qty SET NOT NULL
    `);
    await qr.query(`
      ALTER TABLE sale_items
        ADD COLUMN IF NOT EXISTS unit_id uuid NULL
          REFERENCES product_sellable_units(id) ON DELETE SET NULL
    `);
    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_sale_items_unit_id
        ON sale_items(unit_id)
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_sale_items_unit_id`);
    await qr.query(`
      ALTER TABLE sale_items
        DROP COLUMN IF EXISTS unit_id
    `);
    await qr.query(`
      ALTER TABLE sale_items
        DROP COLUMN IF EXISTS base_unit_qty
    `);
  }
}
