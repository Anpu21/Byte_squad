import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase C2 — reason-coded stock-adjustment workflow.
 *
 * New table `stock_adjustments`: a physical-count correction (Damage, Expired,
 * Theft, Stock_Take, Other) that sets `inventory.quantity` to `physical_quantity`
 * and appends an `Adjustment` stock-movement. Admin/small-manager corrections
 * apply immediately (status Approved); large manager corrections wait on admin
 * approval (Pending). Reversals flip the status to Reversed.
 *
 * Mirrors `backend/migrations/2026-06-04-create-stock-adjustments.sql`.
 */
export class CreateStockAdjustments1779730100000 implements MigrationInterface {
  name = 'CreateStockAdjustments1779730100000';
  private readonly logger = new Logger(
    CreateStockAdjustments1779730100000.name,
  );

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
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
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_stock_adjustments_branch_status_created"
        ON "stock_adjustments" ("branch_id", "status", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_stock_adjustments_product_branch"
        ON "stock_adjustments" ("product_id", "branch_id")
    `);
    this.logger.log('Created stock_adjustments table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_adjustments"`);
  }
}
