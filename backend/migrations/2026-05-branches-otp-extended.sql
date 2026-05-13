-- LedgerPro — extend `branches` with structured address + contact + branch code,
-- and add `pending_branch_actions` table to support OTP-gated create/update/delete.
--
-- WHEN TO RUN: Stop the backend, apply this SQL, then start the backend with
-- the new code. DB_SYNC=true is for development only; production must run this
-- migration (or an equivalent reviewed migration) before deploying the code.

BEGIN;

-- 1) Rename legacy single-line address → address_line_1.
ALTER TABLE branches RENAME COLUMN address TO address_line_1;

-- 2) Add new structured-address and contact columns (nullable for backfill).
ALTER TABLE branches
    ADD COLUMN IF NOT EXISTS code varchar(16),
    ADD COLUMN IF NOT EXISTS email varchar,
    ADD COLUMN IF NOT EXISTS address_line_2 varchar,
    ADD COLUMN IF NOT EXISTS city varchar,
    ADD COLUMN IF NOT EXISTS state varchar,
    ADD COLUMN IF NOT EXISTS country varchar,
    ADD COLUMN IF NOT EXISTS postal_code varchar;

-- 3) Backfill branch_code for existing rows: BR001, BR002, BR003, …
--    Ordering by created_at keeps the canonical "Main Branch" at BR001.
WITH numbered AS (
    SELECT id,
           'BR' || lpad(
               (row_number() OVER (ORDER BY created_at, id))::text,
               3,
               '0'
           ) AS new_code
    FROM branches
    WHERE code IS NULL
)
UPDATE branches AS b
SET code = numbered.new_code
FROM numbered
WHERE b.id = numbered.id;

-- 4) Lock the code column down: NOT NULL + UNIQUE.
ALTER TABLE branches
    ALTER COLUMN code SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'branches_code_unique'
    ) THEN
        ALTER TABLE branches
            ADD CONSTRAINT branches_code_unique UNIQUE (code);
    END IF;
END $$;

-- 5) Pending branch action table — stages create/update/delete pending OTP
--    confirmation. One row per pending mutation. consumed_at marks
--    successful confirmation; expires_at gates time-based invalidation.
CREATE TABLE IF NOT EXISTS pending_branch_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type varchar(16) NOT NULL
        CHECK (action_type IN ('create', 'update', 'delete')),
    branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
    payload jsonb,
    otp_code varchar(6) NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_branch_actions_user_id
    ON pending_branch_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_branch_actions_expires_at
    ON pending_branch_actions(expires_at);

COMMIT;
