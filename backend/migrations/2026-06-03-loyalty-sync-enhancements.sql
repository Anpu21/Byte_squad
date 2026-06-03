-- LedgerPro — loyalty sync enhancements.
--
-- Adds the physical/online loyalty sync primitives used by the backend:
-- sale-level walk-in owner persistence, redemption reserve / tier
-- settings, and audit entry types for earn reversal + wallet merge.

BEGIN;

ALTER TYPE loyalty_ledger_entries_type_enum
    ADD VALUE IF NOT EXISTS 'earn_reversed';

ALTER TYPE loyalty_ledger_entries_type_enum
    ADD VALUE IF NOT EXISTS 'merge_transfer';

ALTER TABLE loyalty_settings
    ADD COLUMN IF NOT EXISTS min_redeemable_points integer NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS silver_tier_points integer NOT NULL DEFAULT 1000,
    ADD COLUMN IF NOT EXISTS gold_tier_points integer NOT NULL DEFAULT 5000;

ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS loyalty_customer_id uuid;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_sales_loyalty_customer'
    ) THEN
        ALTER TABLE sales
            ADD CONSTRAINT fk_sales_loyalty_customer
            FOREIGN KEY (loyalty_customer_id)
            REFERENCES loyalty_customers(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_loyalty_customer_id
    ON sales (loyalty_customer_id);

COMMIT;
