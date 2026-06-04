import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `product_sellable_units` table that backs
 * `GET /pos/products/:productId/units` and the conversion-to-base lookup at
 * `GET /pos/products/:productId/units/:unitName/base-qty`. Empty by default;
 * products with no rows are treated as having a single implicit base unit
 * ("each") by the cashier UI fallback.
 *
 * Mirrors the SQL migration `2026-05-10-create-product-sellable-units.sql`
 * so projects can apply via either TypeORM migration runner or psql.
 *
 * Reversible: down() drops the table.
 */
export class CreateProductSellableUnits1779513094000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS product_sellable_units (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        name varchar(32) NOT NULL,
        barcode varchar(128),
        is_base boolean NOT NULL DEFAULT false,
        conversion_to_base decimal(14, 6) NOT NULL DEFAULT 1,
        selling_price decimal(12, 2) NOT NULL DEFAULT 0,
        display_order integer NOT NULL DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT uq_product_sellable_units_product_name UNIQUE (product_id, name)
      )
    `);
    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_product_sellable_units_product
        ON product_sellable_units (product_id)
    `);
    await qr.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_product_sellable_units_barcode
        ON product_sellable_units (barcode)
        WHERE barcode IS NOT NULL
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS uq_product_sellable_units_barcode`);
    await qr.query(`DROP INDEX IF EXISTS idx_product_sellable_units_product`);
    await qr.query(`DROP TABLE IF EXISTS product_sellable_units`);
  }
}
