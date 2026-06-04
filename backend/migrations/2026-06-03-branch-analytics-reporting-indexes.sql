-- LedgerPro — branch analytics reporting indexes.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_sales_branch_created_status_type
    ON sales (branch_id, created_at, status, type);

CREATE INDEX IF NOT EXISTS idx_payments_sale_method_status
    ON payments (sale_id, payment_method, status);

CREATE INDEX IF NOT EXISTS idx_customer_orders_branch_created_status_mode
    ON customer_orders (branch_id, created_at, status, payment_mode);

CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_branch_created_type
    ON loyalty_ledger_entries (branch_id, created_at, type);

COMMIT;
