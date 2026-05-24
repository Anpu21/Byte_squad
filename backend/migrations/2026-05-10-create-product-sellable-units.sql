-- LedgerPro — Phase 4 of cashier-POS Shanel port.
--
-- Creates the `product_sellable_units` table that backs
-- `GET /pos/products/:productId/units` and the conversion-to-base lookup at
-- `GET /pos/products/:productId/units/:unitName/base-qty`. Empty by default;
-- products with no rows are treated as having a single implicit base unit
-- ("each") by the cashier UI fallback.
--
-- WHEN TO RUN: Stop the backend (with DB_SYNC=false), apply this SQL, then
-- start the backend with the new entity. If DB_SYNC=true for local dev,
-- TypeORM will reconcile to the new schema on next boot.

BEGIN;

CREATE TABLE IF NOT EXISTS product_sellable_units (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name varchar(32) NOT NULL,
    is_base boolean NOT NULL DEFAULT false,
    conversion_to_base decimal(14, 6) NOT NULL DEFAULT 1,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_sellable_units_product_name UNIQUE (product_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_sellable_units_product
    ON product_sellable_units (product_id);

COMMIT;
