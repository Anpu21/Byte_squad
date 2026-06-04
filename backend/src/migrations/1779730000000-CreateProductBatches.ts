import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase C1 — product/batch expiry tracking.
 *
 * New table `product_batches`: one row per physical goods-receipt lot for a
 * (product, branch) with an optional batch/lot number and expiry date. It is an
 * additive tracking layer over `inventory.quantity` (which stays the
 * authoritative sell-from total) and powers the expiry report + expiry alerts.
 *
 * Mirrors `backend/migrations/2026-06-04-create-product-batches.sql`.
 */
export class CreateProductBatches1779730000000 implements MigrationInterface {
  name = 'CreateProductBatches1779730000000';
  private readonly logger = new Logger(CreateProductBatches1779730000000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
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
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_product_batches_branch_expiry"
        ON "product_batches" ("branch_id", "expiry_date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_product_batches_product_branch"
        ON "product_batches" ("product_id", "branch_id")
    `);
    this.logger.log('Created product_batches table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_batches"`);
  }
}
