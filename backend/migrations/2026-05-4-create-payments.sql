-- LedgerPro - Phase 2 of cashier-POS Shanel port.
--
-- Creates the `payments` table for Shanel's multi-tender model. One row per
-- Sale; columns capture the split across cash, card, mobile, cheque, bank
-- transfer, and store credit.
--
-- WHEN TO RUN: Stop the backend, apply this SQL, then start the backend
-- with the new code. If DB_SYNC=true for local dev, TypeORM will reconcile
-- to the new schema on next boot.
--
-- The equivalent TypeORM MigrationInterface lives at
-- src/migrations/1779504867000-CreatePayments.ts for future CLI use.

BEGIN;

CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
    receipt_no varchar(64) NOT NULL UNIQUE,
    payment_method varchar(32) NOT NULL,
    payment_amount decimal(12, 2) NOT NULL,
    invoice_total decimal(12, 2) NOT NULL,
    cash_tendered decimal(12, 2) NOT NULL DEFAULT 0,
    cash_amount decimal(12, 2) NOT NULL DEFAULT 0,
    cash_change decimal(12, 2) NOT NULL DEFAULT 0,
    cheque_amount decimal(12, 2) NOT NULL DEFAULT 0,
    bank_transfer_amount decimal(12, 2) NOT NULL DEFAULT 0,
    credit_amount decimal(12, 2) NOT NULL DEFAULT 0,
    keep_balance boolean NOT NULL DEFAULT false,
    cheque_no varchar(64) NULL,
    cheque_date date NULL,
    cheque_bank varchar(128) NULL,
    cheque_branch varchar(128) NULL,
    cheque_delivered_by varchar(128) NULL,
    cheque_ref varchar(64) NULL,
    bank_ref varchar(64) NULL,
    status varchar(32) NOT NULL DEFAULT 'Active',
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments (sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments (payment_method);

COMMIT;
