-- LedgerPro — Phase 5 fix-up: sale_items was silently dropping baseUnitQty
-- and unitId. PosWriteService.createSale was writing both values, but the
-- entity had no columns, so void/return flows had no way to reconstruct
-- what the cashier actually rang up.
--
-- Adds:
--   base_unit_qty  decimal(12,3) NOT NULL — the line quantity converted
--                  into the product's canonical base unit (e.g. 1000 g
--                  typed against a kg-stocked product → 1.000 kg).
--                  Mirrors the inventory.quantity scale so void/return
--                  flows can reconstruct what the cashier rang up.
--   unit_id        uuid NULL — which ProductSellableUnit row was selected
--                  at the till. NULL when the line was rung in the
--                  product's base unit directly. ON DELETE SET NULL
--                  because a unit can be retired after the sale has been
--                  printed.
--
-- Strategy for a populated table:
--   1. ADD base_unit_qty as nullable.
--   2. Backfill from `quantity` (pre-Phase-5 rows had no conversion, so
--      the typed qty equals the base-unit qty).
--   3. ALTER to NOT NULL.
--   4. ADD unit_id with FK + index. NULL is fine for existing rows.
--
-- WHEN TO RUN: Stop the backend (with DB_SYNC=false), apply this SQL,
-- then start the backend with the new entity. If DB_SYNC=true for local
-- dev, TypeORM will reconcile to the new schema on next boot — but the
-- backfill step here is what makes a populated DB safe.

BEGIN;

ALTER TABLE sale_items
    ADD COLUMN IF NOT EXISTS base_unit_qty decimal(12,3);

UPDATE sale_items
SET base_unit_qty = quantity
WHERE base_unit_qty IS NULL;

ALTER TABLE sale_items
    ALTER COLUMN base_unit_qty SET NOT NULL;

ALTER TABLE sale_items
    ADD COLUMN IF NOT EXISTS unit_id uuid NULL
        REFERENCES product_sellable_units(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sale_items_unit_id
    ON sale_items(unit_id);

COMMIT;
