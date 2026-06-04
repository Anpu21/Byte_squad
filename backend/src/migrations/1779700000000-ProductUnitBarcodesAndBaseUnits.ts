import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Moves inventory stock units to the KG/L/UNIT model and adds per-sellable
 * unit barcode + selling-price support for POS pack scans.
 */
export class ProductUnitBarcodesAndBaseUnits1779700000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE product_sellable_units
        ADD COLUMN IF NOT EXISTS barcode varchar(128),
        ADD COLUMN IF NOT EXISTS selling_price decimal(12, 2) NOT NULL DEFAULT 0
    `);

    await qr.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_product_sellable_units_barcode
        ON product_sellable_units (barcode)
        WHERE barcode IS NOT NULL
    `);

    await qr.query(`
      UPDATE products
      SET base_unit = CASE LOWER(base_unit)
        WHEN 'g' THEN 'kg'
        WHEN 'ml' THEN 'l'
        WHEN 'each' THEN 'unit'
        WHEN 'bottle' THEN 'unit'
        WHEN 'pack' THEN 'unit'
        WHEN 'box' THEN 'unit'
        ELSE LOWER(base_unit)
      END
    `);

    await qr.query(`
      ALTER TABLE products
        ALTER COLUMN base_unit SET DEFAULT 'unit'
    `);

    await qr.query(`
      ALTER TABLE sale_items
        ALTER COLUMN quantity TYPE decimal(12, 3)
        USING quantity::decimal(12, 3)
    `);

    await qr.query(`
      DELETE FROM product_sellable_units
      WHERE LOWER(name) IN ('g', 'ml', 'each', 'bottle', 'pack', 'box')
    `);

    await qr.query(`
      INSERT INTO product_sellable_units (
        id,
        product_id,
        name,
        barcode,
        is_base,
        conversion_to_base,
        selling_price,
        display_order,
        created_at,
        updated_at
      )
      SELECT
        gen_random_uuid(),
        p.id,
        p.base_unit,
        NULL,
        TRUE,
        1,
        p.selling_price,
        0,
        now(),
        now()
      FROM products p
      WHERE NOT EXISTS (
        SELECT 1
        FROM product_sellable_units psu
        WHERE psu.product_id = p.id
          AND LOWER(psu.name) = LOWER(p.base_unit)
      )
    `);

    await qr.query(`
      UPDATE product_sellable_units psu
      SET
        is_base = TRUE,
        conversion_to_base = 1,
        selling_price = p.selling_price,
        display_order = 0,
        updated_at = now()
      FROM products p
      WHERE psu.product_id = p.id
        AND LOWER(psu.name) = LOWER(p.base_unit)
    `);

    await qr.query(`
      UPDATE product_sellable_units psu
      SET
        is_base = FALSE,
        selling_price = ROUND(
          (p.selling_price * psu.conversion_to_base)::numeric,
          2
        ),
        updated_at = now()
      FROM products p
      WHERE psu.product_id = p.id
        AND LOWER(psu.name) <> LOWER(p.base_unit)
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      DROP INDEX IF EXISTS uq_product_sellable_units_barcode
    `);
    await qr.query(`
      ALTER TABLE product_sellable_units
        DROP COLUMN IF EXISTS selling_price,
        DROP COLUMN IF EXISTS barcode
    `);
    await qr.query(`
      ALTER TABLE products
        ALTER COLUMN base_unit SET DEFAULT 'each'
    `);
    await qr.query(`
      ALTER TABLE sale_items
        ALTER COLUMN quantity TYPE integer
        USING ROUND(quantity)::integer
    `);
  }
}
