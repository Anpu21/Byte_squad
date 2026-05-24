-- LedgerPro - Phase 3 of cashier-POS Shanel port.
--
-- Adds the `current_balance` column to `users` so the POS credit-ledger flow
-- has a per-customer running balance anchor. decimal(12,2) NOT NULL DEFAULT 0
-- means existing rows survive without backfill (every account starts at 0).
--
-- WHEN TO RUN: Stop the backend (with DB_SYNC=false), apply this SQL, then
-- start the backend with the extended entity. If DB_SYNC=true for local dev,
-- TypeORM will reconcile to the extended schema on next boot.
--
-- The equivalent TypeORM MigrationInterface lives at
-- src/migrations/1779513092000-AddUserCurrentBalance.ts for future CLI use.

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS current_balance decimal(12, 2) NOT NULL DEFAULT 0;

COMMIT;
