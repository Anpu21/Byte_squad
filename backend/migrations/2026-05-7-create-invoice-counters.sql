-- LedgerPro - Phase 2 of cashier-POS Shanel port.
--
-- Creates the `invoice_counters` table — one row per calendar year holding
-- the last issued sequence number for the INV-YYYY-NNNNNN invoice number
-- scheme. Read and incremented under a pessimistic write lock from
-- InvoiceNumberService.next() inside the createSale transaction so concurrent
-- checkouts never collide on the same invoice number.
--
-- WHEN TO RUN: Stop the backend, apply this SQL, then start the backend
-- with the new code. If DB_SYNC=true for local dev, TypeORM will
-- reconcile on next boot.
--
-- The equivalent TypeORM MigrationInterface lives at
-- src/migrations/1779504870000-CreateInvoiceCounters.ts for future CLI use.

BEGIN;

CREATE TABLE IF NOT EXISTS invoice_counters (
    year integer PRIMARY KEY,
    last_seq integer NOT NULL DEFAULT 0,
    updated_at timestamp NOT NULL DEFAULT now()
);

COMMIT;
