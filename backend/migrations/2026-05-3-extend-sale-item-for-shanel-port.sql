-- LedgerPro - Phase 2 of cashier-POS Shanel port.
--
-- Adds Shanel-required line-level columns to `sale_items`. Safe defaults
-- mean existing rows survive without backfill.
--
-- WHEN TO RUN: Stop the backend, apply this SQL, then start the backend
-- with the extended entity. If DB_SYNC=true for local dev, TypeORM will
-- reconcile to the extended schema on next boot.
--
-- The equivalent TypeORM MigrationInterface lives at
-- src/migrations/1779504866000-ExtendSaleItemForShanelPort.ts for future
-- CLI use.

BEGIN;

ALTER TABLE sale_items
    ADD COLUMN IF NOT EXISTS price_level_used varchar(32) NOT NULL DEFAULT 'Retail',
    ADD COLUMN IF NOT EXISTS line_discount_percentage decimal(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS line_subtotal decimal(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS line_tax_rate decimal(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS line_tax_amount decimal(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS free decimal(12, 3) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS location_taken_from varchar(64) NOT NULL DEFAULT 'Shop',
    ADD COLUMN IF NOT EXISTS status varchar(32) NOT NULL DEFAULT 'Active';

COMMIT;
