-- LedgerPro - one-shot migration for shop orders, PayHere payments, loyalty.
--
-- WHEN TO RUN: Stop the backend, apply this SQL, then start the backend with
-- the new code. DB_SYNC=true is for development only; production should use
-- this migration or an equivalent reviewed migration.

BEGIN;

ALTER TABLE IF EXISTS customer_requests RENAME TO customer_orders;
ALTER TABLE IF EXISTS customer_request_items RENAME TO customer_order_items;

ALTER TABLE customer_orders RENAME COLUMN request_code TO order_code;
ALTER TABLE customer_order_items RENAME COLUMN request_id TO order_id;

ALTER TYPE transactions_payment_method_enum ADD VALUE IF NOT EXISTS 'online';
ALTER TYPE notifications_type_enum ADD VALUE IF NOT EXISTS 'customer_order';

UPDATE notifications
SET type = 'customer_order'
WHERE type = 'customer_request';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_orders_payment_mode_enum') THEN
        CREATE TYPE customer_orders_payment_mode_enum AS ENUM ('manual', 'online');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_orders_payment_status_enum') THEN
        CREATE TYPE customer_orders_payment_status_enum AS ENUM ('unpaid', 'pending', 'paid', 'failed', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payhere_payment_attempts_status_enum') THEN
        CREATE TYPE payhere_payment_attempts_status_enum AS ENUM ('pending', 'paid', 'failed', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loyalty_ledger_entries_type_enum') THEN
        CREATE TYPE loyalty_ledger_entries_type_enum AS ENUM ('earned', 'redeemed', 'reversed', 'adjusted');
    END IF;
END $$;

ALTER TABLE customer_orders
    ADD COLUMN IF NOT EXISTS loyalty_discount_amount numeric(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS final_total numeric(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_mode customer_orders_payment_mode_enum NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS payment_status customer_orders_payment_status_enum NOT NULL DEFAULT 'unpaid',
    ADD COLUMN IF NOT EXISTS loyalty_points_redeemed integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loyalty_points_earned integer NOT NULL DEFAULT 0;

UPDATE customer_orders
SET final_total = estimated_total
WHERE final_total = 0;

CREATE TABLE IF NOT EXISTS payhere_payment_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
    provider_order_id varchar NOT NULL UNIQUE,
    payhere_payment_id varchar,
    amount numeric(12, 2) NOT NULL,
    currency varchar(3) NOT NULL DEFAULT 'LKR',
    status payhere_payment_attempts_status_enum NOT NULL DEFAULT 'pending',
    signature_valid boolean NOT NULL DEFAULT false,
    notify_payload jsonb,
    paid_at timestamptz,
    failed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payhere_payment_attempts_order_id
    ON payhere_payment_attempts(order_id);

CREATE TABLE IF NOT EXISTS loyalty_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    points_balance integer NOT NULL DEFAULT 0,
    lifetime_points_earned integer NOT NULL DEFAULT 0,
    lifetime_points_redeemed integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_ledger_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id uuid REFERENCES customer_orders(id) ON DELETE SET NULL,
    type loyalty_ledger_entries_type_enum NOT NULL,
    points integer NOT NULL,
    description varchar NOT NULL,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_entries_user_id
    ON loyalty_ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_entries_order_id
    ON loyalty_ledger_entries(order_id);

COMMIT;
