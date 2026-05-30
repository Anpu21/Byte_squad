-- LedgerPro — Phase BE-L1 of the loyalty re-architecture.
--
-- Opens loyalty to walk-in customers (phone-as-identity) alongside
-- the existing user-keyed online customers, and stamps the
-- originating branch on every ledger row so the admin
-- "active at branch X since <date>" filter stays cheap.
--
-- This script mirrors the TypeORM migration
-- `1779620084672-LoyaltyPhoneUniqueAndBranch.ts`. Either path
-- produces the same schema.
--
-- WHEN TO RUN: After all prior 2026-05 migrations. Idempotency is NOT
-- attempted here — the TypeORM migration runner already handles
-- "applied / not applied" via the migrations table, and this script
-- is the manual companion for environments that apply raw SQL.
--
-- SAFETY: This script will FAIL if `users` already contains duplicate
-- non-null phone numbers. Dedupe `users.phone` first, then re-run.

BEGIN;

-- 1. Refuse to proceed if users.phone has duplicates. The partial
--    unique index added below would silently fail to apply otherwise
--    on the CREATE INDEX statement; the explicit RAISE here gives a
--    clearer error.
DO $$
DECLARE
    dupe_count int;
    sample_dupes text;
BEGIN
    SELECT COUNT(*),
           string_agg(phone || ' (x' || cnt || ')', ', ')
    INTO dupe_count, sample_dupes
    FROM (
        SELECT phone, COUNT(*) AS cnt
        FROM users
        WHERE phone IS NOT NULL
        GROUP BY phone
        HAVING COUNT(*) > 1
        LIMIT 3
    ) AS d;

    IF dupe_count IS NOT NULL AND dupe_count > 0 THEN
        RAISE EXCEPTION
            'Cannot enforce unique(phone) on users — duplicate non-null phone(s) found. Example: %',
            sample_dupes;
    END IF;
END $$;

-- 2. Walk-in loyalty identity table.
CREATE TABLE loyalty_customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone varchar(16) NOT NULL,
    first_name varchar(60) NOT NULL,
    last_name varchar(60),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT uq_loyalty_customers_phone UNIQUE (phone)
);

-- 3. Partial unique index on users.phone — enforced only where phone
--    is provided. Allows multiple users with NULL phone while
--    blocking duplicate real phone numbers (needed for the future
--    "online sign-up matches walk-in phone -> merge" path).
CREATE UNIQUE INDEX uq_users_phone_not_null
    ON users (phone)
    WHERE phone IS NOT NULL;

-- 4. loyalty_accounts -> polymorphic owner.
ALTER TABLE loyalty_accounts
    DROP CONSTRAINT IF EXISTS loyalty_accounts_user_id_key;
ALTER TABLE loyalty_accounts
    DROP CONSTRAINT IF EXISTS "UQ_loyalty_accounts_user_id";
DROP INDEX IF EXISTS "IDX_loyalty_accounts_user_id";

ALTER TABLE loyalty_accounts
    ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE loyalty_accounts
    ADD COLUMN loyalty_customer_id uuid;
ALTER TABLE loyalty_accounts
    ADD CONSTRAINT fk_loyalty_accounts_loyalty_customer
        FOREIGN KEY (loyalty_customer_id)
        REFERENCES loyalty_customers(id)
        ON DELETE CASCADE;

CREATE UNIQUE INDEX uq_loyalty_accounts_user_id_not_null
    ON loyalty_accounts (user_id)
    WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_loyalty_accounts_loyalty_customer_id_not_null
    ON loyalty_accounts (loyalty_customer_id)
    WHERE loyalty_customer_id IS NOT NULL;

ALTER TABLE loyalty_accounts
    ADD CONSTRAINT ck_loyalty_accounts_owner_exactly_one
        CHECK (
            (user_id IS NOT NULL AND loyalty_customer_id IS NULL)
            OR (user_id IS NULL AND loyalty_customer_id IS NOT NULL)
        );

-- 5. loyalty_ledger_entries -> polymorphic owner + branch stamping.
ALTER TABLE loyalty_ledger_entries
    ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE loyalty_ledger_entries
    ADD COLUMN loyalty_customer_id uuid;
ALTER TABLE loyalty_ledger_entries
    ADD COLUMN branch_id uuid;

ALTER TABLE loyalty_ledger_entries
    ADD CONSTRAINT fk_loyalty_ledger_loyalty_customer
        FOREIGN KEY (loyalty_customer_id)
        REFERENCES loyalty_customers(id)
        ON DELETE CASCADE;
ALTER TABLE loyalty_ledger_entries
    ADD CONSTRAINT fk_loyalty_ledger_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(id)
        ON DELETE SET NULL;

ALTER TABLE loyalty_ledger_entries
    DROP CONSTRAINT IF EXISTS "UQ_loyalty_ledger_user_order_type";
DROP INDEX IF EXISTS "IDX_loyalty_ledger_user_order_type";

-- Two partial uniques replace the would-be strict (user_id, order_id,
-- type) unique. Postgres has no clean OR-unique, so each owner-type
-- slot is unique on its own.
CREATE UNIQUE INDEX uq_loyalty_ledger_user_order_type_not_null
    ON loyalty_ledger_entries (user_id, order_id, type)
    WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_loyalty_ledger_customer_order_type_not_null
    ON loyalty_ledger_entries (loyalty_customer_id, order_id, type)
    WHERE loyalty_customer_id IS NOT NULL;

ALTER TABLE loyalty_ledger_entries
    ADD CONSTRAINT ck_loyalty_ledger_owner_exactly_one
        CHECK (
            (user_id IS NOT NULL AND loyalty_customer_id IS NULL)
            OR (user_id IS NULL AND loyalty_customer_id IS NOT NULL)
        );

-- Composite index for the admin "customers active at branch X since
-- <date>" filter. Descending created_at puts recent rows first.
CREATE INDEX idx_loyalty_ledger_branch_created_at
    ON loyalty_ledger_entries (branch_id, created_at DESC);

COMMIT;
