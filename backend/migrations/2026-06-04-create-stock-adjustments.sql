-- Phase C2 — reason-coded stock-adjustment workflow.
-- Mirrors backend/src/migrations/1779730100000-CreateStockAdjustments.ts.

CREATE TABLE "stock_adjustments" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "reason" varchar(20) NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'Approved',
  "quantity_before" numeric(12,3) NOT NULL,
  "physical_quantity" numeric(12,3) NOT NULL,
  "difference" numeric(12,3) NOT NULL,
  "notes" varchar(255),
  "created_by_user_id" uuid NOT NULL,
  "reviewed_by_user_id" uuid,
  "reviewed_at" TIMESTAMP,
  "reversed_by_user_id" uuid,
  "reversed_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_stock_adjustments" PRIMARY KEY ("id"),
  CONSTRAINT "FK_stock_adjustments_product" FOREIGN KEY ("product_id")
    REFERENCES "products"("id") ON DELETE RESTRICT,
  CONSTRAINT "FK_stock_adjustments_branch" FOREIGN KEY ("branch_id")
    REFERENCES "branches"("id") ON DELETE RESTRICT
);

CREATE INDEX "IDX_stock_adjustments_branch_status_created"
  ON "stock_adjustments" ("branch_id", "status", "created_at");
CREATE INDEX "IDX_stock_adjustments_product_branch"
  ON "stock_adjustments" ("product_id", "branch_id");
