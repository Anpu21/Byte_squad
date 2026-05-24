import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills `product_sellable_units` for products that have no rows yet so
 * the cashier unit-picker isn't stuck on the base unit. Mirrors the SQL
 * migration `2026-05-15-seed-default-sellable-units.sql` and the
 * TypeScript helper at
 * `backend/src/modules/products/lib/default-sellable-units.ts`.
 *
 * Approach: two NOT EXISTS-gated inserts so re-running the migration is a
 * no-op for any product that already has at least one row.
 *
 * Down strategy: this is a data backfill, not a schema change. A blanket
 * DELETE would also remove any user-customised units that happen to match
 * the seed shape, so down() is a logged no-op. To revert in dev, drop the
 * table via `CreateProductSellableUnits` rollback and re-create.
 */
export class SeedDefaultSellableUnits1779584407096 implements MigrationInterface {
  private readonly logger = new Logger(
    SeedDefaultSellableUnits1779584407096.name,
  );

  public async up(qr: QueryRunner): Promise<void> {
    // 1. Known base units (metric mass / volume + discrete shells)
    await qr.query(`
      INSERT INTO product_sellable_units (
        id, product_id, name, is_base, conversion_to_base, display_order,
        created_at, updated_at
      )
      SELECT
        gen_random_uuid(),
        p.id,
        seed.name,
        seed.is_base,
        seed.conversion_to_base,
        seed.display_order,
        now(),
        now()
      FROM products p
      CROSS JOIN LATERAL (
        VALUES
          ('kg',     'kg',     TRUE,  1::numeric,     0),
          ('kg',     'g',      FALSE, 0.001::numeric, 1),
          ('g',      'g',      TRUE,  1::numeric,     0),
          ('g',      'kg',     FALSE, 1000::numeric,  1),
          ('l',      'l',      TRUE,  1::numeric,     0),
          ('l',      'ml',     FALSE, 0.001::numeric, 1),
          ('ml',     'ml',     TRUE,  1::numeric,     0),
          ('ml',     'l',      FALSE, 1000::numeric,  1),
          ('each',   'each',   TRUE,  1::numeric,     0),
          ('bottle', 'bottle', TRUE,  1::numeric,     0),
          ('pack',   'pack',   TRUE,  1::numeric,     0),
          ('box',    'box',    TRUE,  1::numeric,     0)
      ) AS seed(base_unit, name, is_base, conversion_to_base, display_order)
      WHERE LOWER(p.base_unit) = seed.base_unit
        AND NOT EXISTS (
          SELECT 1 FROM product_sellable_units psu
          WHERE psu.product_id = p.id
        )
    `);

    // 2. Fallback self-mirror row for products with unknown base units.
    await qr.query(`
      INSERT INTO product_sellable_units (
        id, product_id, name, is_base, conversion_to_base, display_order,
        created_at, updated_at
      )
      SELECT
        gen_random_uuid(),
        p.id,
        p.base_unit,
        TRUE,
        1,
        0,
        now(),
        now()
      FROM products p
      WHERE LOWER(p.base_unit) NOT IN (
          'kg', 'g', 'l', 'ml', 'each', 'bottle', 'pack', 'box'
        )
        AND NOT EXISTS (
          SELECT 1 FROM product_sellable_units psu
          WHERE psu.product_id = p.id
        )
    `);
  }

  public down(_qr: QueryRunner): Promise<void> {
    // Intentionally a no-op. The seed shape (e.g. base-unit row with
    // conversion 1, isBase=true) is indistinguishable from a user-created
    // row, so a targeted DELETE risks destroying real cashier
    // customisations. Operators who need to wipe the table should roll back
    // CreateProductSellableUnits1779513094000 instead.
    void _qr;
    this.logger.warn(
      'SeedDefaultSellableUnits.down() is a no-op by design. ' +
        'Rollback the CreateProductSellableUnits migration to reset.',
    );
    return Promise.resolve();
  }
}
