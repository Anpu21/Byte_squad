-- LedgerPro - Phase 2 of cashier-POS Shanel port.
--
-- Creates the `stock_movements` append-only audit log. Every inventory
-- delta (sale, void, purchase, transfer, adjustment, return) writes one
-- row so downstream reports can rebuild stock-on-hand timelines.
--
-- WHEN TO RUN: Stop the backend, apply this SQL, then start the backend
-- with the new code. If DB_SYNC=true for local dev, TypeORM will
-- reconcile on next boot.
--
-- The equivalent TypeORM MigrationInterface lives at
-- src/migrations/1779504869000-CreateStockMovements.ts for future CLI use.

BEGIN;

CREATE TABLE IF NOT EXISTS stock_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    branch_id uuid NOT NULL REFERENCES branches (id) ON DELETE RESTRICT,
    location varchar(64) NOT NULL DEFAULT 'Shop',
    movement_type varchar(32) NOT NULL,
    qty_in decimal(12, 3) NOT NULL DEFAULT 0,
    qty_out decimal(12, 3) NOT NULL DEFAULT 0,
    balance_after decimal(12, 3) NOT NULL,
    ref_type varchar(32) NULL,
    ref_id uuid NULL,
    notes varchar(255) NULL,
    created_by_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sm_product_branch
    ON stock_movements (product_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_sm_ref
    ON stock_movements (ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_sm_created_at
    ON stock_movements (created_at DESC);

COMMIT;
