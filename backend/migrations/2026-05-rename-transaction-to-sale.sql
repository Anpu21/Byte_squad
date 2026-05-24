-- LedgerPro - Phase 0 of cashier-POS Shanel port.
--
-- Pure rename: Transaction -> Sale (no behavior or data change).
--
-- WHEN TO RUN: stop the backend (with DB_SYNC=false), apply this SQL, then
-- start the backend with the renamed entities. If you're running DB_SYNC=true
-- for local dev, TypeORM will reconcile to the renamed schema on next boot.
--
-- The equivalent TypeORM MigrationInterface lives at
-- src/migrations/1779501151003-RenameTransactionToSale.ts for future CLI use.

BEGIN;

ALTER TABLE IF EXISTS transactions RENAME TO sales;
ALTER TABLE IF EXISTS transaction_items RENAME TO sale_items;

ALTER TABLE sale_items RENAME COLUMN transaction_id TO sale_id;
ALTER TABLE ledger_entries RENAME COLUMN transaction_id TO sale_id;
ALTER TABLE pos_idempotency_keys RENAME COLUMN transaction_id TO sale_id;

-- Rename related sequences / constraints / indexes that postgres derived from
-- the old table names so future generations stay consistent. These are
-- best-effort renames; missing rows are silently ignored.
DO $$
DECLARE
  rec record;
BEGIN
  -- Sequences (e.g. transactions_id_seq -> sales_id_seq)
  FOR rec IN
    SELECT c.relname AS old_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND n.nspname = current_schema()
      AND (
        c.relname LIKE 'transactions\_%' ESCAPE '\'
        OR c.relname LIKE 'transaction\_items\_%' ESCAPE '\'
      )
  LOOP
    EXECUTE format(
      'ALTER SEQUENCE %I RENAME TO %I',
      rec.old_name,
      replace(replace(rec.old_name, 'transaction_items_', 'sale_items_'), 'transactions_', 'sales_')
    );
  END LOOP;

  -- Indexes that include the old table name
  FOR rec IN
    SELECT indexname AS old_name
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND (
        indexname LIKE 'transactions\_%' ESCAPE '\'
        OR indexname LIKE 'transaction\_items\_%' ESCAPE '\'
      )
  LOOP
    EXECUTE format(
      'ALTER INDEX %I RENAME TO %I',
      rec.old_name,
      replace(replace(rec.old_name, 'transaction_items_', 'sale_items_'), 'transactions_', 'sales_')
    );
  END LOOP;
END $$;

COMMIT;
