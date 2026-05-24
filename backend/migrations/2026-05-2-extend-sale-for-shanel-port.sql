-- LedgerPro - Phase 2 of cashier-POS Shanel port.
--
-- Adds Shanel-required columns to `sales` plus indexes. Safe defaults mean
-- existing rows survive without backfill.
--
-- WHEN TO RUN: Stop the backend (with DB_SYNC=false), apply this SQL, then
-- start the backend with the extended entity. If DB_SYNC=true for local dev,
-- TypeORM will reconcile to the extended schema on next boot.
--
-- The equivalent TypeORM MigrationInterface lives at
-- src/migrations/1779504865000-ExtendSaleForShanelPort.ts for future CLI use.

BEGIN;

ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS sale_type varchar(32) NOT NULL DEFAULT 'Retail',
    ADD COLUMN IF NOT EXISTS price_level varchar(32) NOT NULL DEFAULT 'Retail',
    ADD COLUMN IF NOT EXISTS discount_percentage decimal(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_rate decimal(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS paid_amount decimal(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS balance_due decimal(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_status varchar(32) NOT NULL DEFAULT 'Unpaid',
    ADD COLUMN IF NOT EXISTS status varchar(32) NOT NULL DEFAULT 'Active',
    ADD COLUMN IF NOT EXISTS location varchar(64) NOT NULL DEFAULT 'Shop',
    ADD COLUMN IF NOT EXISTS customer_user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS voided_reason varchar(255) NULL,
    ADD COLUMN IF NOT EXISTS voided_at timestamp NULL,
    ADD COLUMN IF NOT EXISTS voided_by_user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_status ON sales (status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales (payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_customer_user ON sales (customer_user_id);

COMMIT;
