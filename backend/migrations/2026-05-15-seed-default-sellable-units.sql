-- LedgerPro -- Phase A1 of cashier-POS Shanel port.
--
-- Backfills `product_sellable_units` for products that have no rows yet, so
-- the cashier unit-picker actually has something to switch to. Mirrors the
-- TypeScript helper `defaultSellableUnitsFor` in
-- `backend/src/modules/products/lib/default-sellable-units.ts`.
--
-- Behaviour:
--   * Products whose `base_unit` matches a known metric/discrete unit get
--     the canonical companion set (kg <-> g, l <-> ml, or a single
--     self-mirror row for each / bottle / pack / box).
--   * Products with any other `base_unit` (e.g. `dozen`, `pcs`) get a
--     single self-mirror row so the dropdown is never empty.
--   * Both inserts are gated by NOT EXISTS so re-running this script is a
--     no-op for products that already have any rows -- safe to apply
--     multiple times during dev iteration.
--
-- WHEN TO RUN: After migration 2026-05-10 (creates the table) and any
-- product-seeding scripts. Idempotent.

BEGIN;

-- 1. Known base units: insert the full lookup table for each matching
--    product, skipping products that already have any sellable-units rows.
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
  );

-- 2. Unknown base units: insert a single self-mirror row for any product
--    whose `base_unit` doesn't appear in the lookup above and still has no
--    rows after step 1.
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
  );

COMMIT;
