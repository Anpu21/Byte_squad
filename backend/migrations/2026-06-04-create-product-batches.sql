-- Phase C1 — product/batch expiry tracking.
-- Mirrors backend/src/migrations/1779730000000-CreateProductBatches.ts.

CREATE TABLE "product_batches" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "batch_no" varchar(64),
  "expiry_date" date,
  "quantity" numeric(12,3) NOT NULL DEFAULT 0,
  "received_at" TIMESTAMP NOT NULL DEFAULT now(),
  "notes" varchar(255),
  "created_by_user_id" uuid NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_product_batches" PRIMARY KEY ("id"),
  CONSTRAINT "FK_product_batches_product" FOREIGN KEY ("product_id")
    REFERENCES "products"("id") ON DELETE RESTRICT,
  CONSTRAINT "FK_product_batches_branch" FOREIGN KEY ("branch_id")
    REFERENCES "branches"("id") ON DELETE RESTRICT
);

CREATE INDEX "IDX_product_batches_branch_expiry"
  ON "product_batches" ("branch_id", "expiry_date");
CREATE INDEX "IDX_product_batches_product_branch"
  ON "product_batches" ("product_id", "branch_id");
