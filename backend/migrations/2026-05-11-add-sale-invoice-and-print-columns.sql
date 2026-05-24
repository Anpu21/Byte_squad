-- LedgerPro — schema-gap fix between Phase 4 and Phase 5 of the cashier-POS
-- Shanel port.
--
-- Adds invoice-number and bill-print tracking columns to `sales`:
--   invoice_number     varchar UNIQUE NOT NULL — cashier-facing receipt number
--                      issued atomically by InvoiceNumberService.next() at
--                      sale time. Existing rows are backfilled with their
--                      `transaction_number` so the UNIQUE constraint survives.
--   bill_printed       boolean DEFAULT false — true once the receipt has been
--                      printed at least once.
--   bill_print_count   integer DEFAULT 0     — incremented each reprint.
--   first_print_date   timestamp NULL        — timestamp of the first print.
--   last_print_date    timestamp NULL        — timestamp of the most recent
--                      print.
--
-- Strategy for invoice_number on a populated table:
--   1. ADD COLUMN as nullable, no UNIQUE.
--   2. Backfill from `transaction_number` (already unique).
--   3. ALTER to NOT NULL and add the UNIQUE constraint.
--
-- WHEN TO RUN: Stop the backend (with DB_SYNC=false), apply this SQL, then
-- start the backend with the new entity. If DB_SYNC=true for local dev,
-- TypeORM will reconcile to the new schema on next boot — but the backfill
-- step here is what makes a populated DB safe.

BEGIN;

ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS invoice_number varchar,
    ADD COLUMN IF NOT EXISTS bill_printed boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS bill_print_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS first_print_date timestamp NULL,
    ADD COLUMN IF NOT EXISTS last_print_date timestamp NULL;

UPDATE sales
SET invoice_number = transaction_number
WHERE invoice_number IS NULL;

ALTER TABLE sales
    ALTER COLUMN invoice_number SET NOT NULL;

ALTER TABLE sales
    ADD CONSTRAINT uq_sales_invoice_number UNIQUE (invoice_number);

COMMIT;
