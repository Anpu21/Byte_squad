-- LedgerPro - Phase 3 of cashier-POS Shanel port.
--
-- Adds three Shanel-required columns to `products`:
--   wholesale_price  decimal(12,2) DEFAULT 0 — alternate price tier the POS
--                    cashier can toggle to instead of selling_price.
--   tax_rate         decimal(5,2)  DEFAULT 0 — per-product VAT/GST percentage.
--   discount_allowed boolean       DEFAULT true — when false the POS UI must
--                    reject manual discounts on this line item.
--
-- Safe defaults mean existing rows survive without backfill.
--
-- WHEN TO RUN: Stop the backend (with DB_SYNC=false), apply this SQL, then
-- start the backend with the extended entity. If DB_SYNC=true for local dev,
-- TypeORM will reconcile to the extended schema on next boot.
--
-- The equivalent TypeORM MigrationInterface lives at
-- src/migrations/1779513093000-AddProductWholesaleAndTax.ts for future CLI use.

BEGIN;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS wholesale_price decimal(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_rate decimal(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_allowed boolean NOT NULL DEFAULT true;

COMMIT;
