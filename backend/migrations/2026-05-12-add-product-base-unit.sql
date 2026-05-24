-- LedgerPro — schema-gap fix between Phase 4 and Phase 5 of the cashier-POS
-- Shanel port.
--
-- Adds the `base_unit` column to `products`:
--   base_unit  varchar(32) NOT NULL DEFAULT 'each' — the canonical unit of
--              measure used when no per-product sellable unit row exists
--              (and as the "isBase" anchor when they do). Defaults to 'each'
--              so existing single-unit products keep their current behaviour
--              without any data migration.
--
-- Safe default means existing rows survive without backfill.
--
-- WHEN TO RUN: Stop the backend (with DB_SYNC=false), apply this SQL, then
-- start the backend with the new entity. If DB_SYNC=true for local dev,
-- TypeORM will reconcile to the new schema on next boot.

BEGIN;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS base_unit varchar(32) NOT NULL DEFAULT 'each';

COMMIT;
