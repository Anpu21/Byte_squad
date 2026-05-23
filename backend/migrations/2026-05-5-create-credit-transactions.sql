-- LedgerPro - Phase 2 of cashier-POS Shanel port.
--
-- Creates the `credit_transactions` audit log for customer store-credit
-- activity. Each row records either a Credit_Taken event (when the POS
-- extends credit on an under-paid sale) or a Credit_Paid event (when
-- the customer pays the balance back).
--
-- WHEN TO RUN: Stop the backend, apply this SQL, then start the backend
-- with the new code. If DB_SYNC=true for local dev, TypeORM will
-- reconcile on next boot.
--
-- The equivalent TypeORM MigrationInterface lives at
-- src/migrations/1779504868000-CreateCreditTransactions.ts for future
-- CLI use.

BEGIN;

CREATE TABLE IF NOT EXISTS credit_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    sale_id uuid NULL REFERENCES sales (id) ON DELETE SET NULL,
    transaction_type varchar(32) NOT NULL,
    amount decimal(12, 2) NOT NULL,
    running_balance decimal(12, 2) NOT NULL,
    reference_no varchar(64) NOT NULL,
    notes varchar(255) NULL,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ct_user ON credit_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_ct_sale ON credit_transactions (sale_id);

COMMIT;
