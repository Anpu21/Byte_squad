-- LedgerPro — Phase 5 fix-up: inventory.quantity was integer, which
-- truncated fractional sales (loose produce typed in grams against a
-- kg-stocked product, juice typed in mL against a litre-stocked product)
-- on every checkout. Widens to decimal(12,3) so the round-trip from
-- `sale_items.base_unit_qty` (also decimal(12,3)) into the inventory
-- ledger preserves the sub-unit portion.
--
-- The `USING quantity::decimal(12,3)` clause is the standard Postgres
-- recipe for widening an integer column to decimal — existing integer
-- values cast cleanly with no precision loss.
--
-- WARNING (rollback): the matching DOWN migration narrows back to
-- integer with `USING quantity::integer`, which TRUNCATES the
-- fractional part of every affected row. Only safe to roll back BEFORE
-- any fractional sales have been recorded.
--
-- WHEN TO RUN: Stop the backend (with DB_SYNC=false), apply this SQL,
-- then start the backend with the new entity. If DB_SYNC=true for local
-- dev, TypeORM will reconcile to the new schema on next boot.

BEGIN;

ALTER TABLE inventory
    ALTER COLUMN quantity TYPE decimal(12,3) USING quantity::decimal(12,3);

COMMIT;
