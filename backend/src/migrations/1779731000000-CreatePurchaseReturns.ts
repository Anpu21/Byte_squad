import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Purchases Phase 1, slice 5 — debit notes (purchase returns) raised
 * against a GRN: stock OUT + CREDIT ledger reversal + bill adjustment.
 */
export class CreatePurchaseReturns1779731000000 implements MigrationInterface {
  name = 'CreatePurchaseReturns1779731000000';
  private readonly logger = new Logger(CreatePurchaseReturns1779731000000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "purchase_returns" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "return_number" varchar(24) NOT NULL,
        "grn_id" uuid NOT NULL,
        "supplier_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "total" numeric(12,2) NOT NULL,
        "reason" text NOT NULL,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_returns" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_purchase_returns_number" UNIQUE ("return_number"),
        CONSTRAINT "FK_purchase_returns_grn" FOREIGN KEY ("grn_id")
          REFERENCES "grns"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_purchase_returns_supplier" FOREIGN KEY ("supplier_id")
          REFERENCES "suppliers"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_purchase_returns_branch" FOREIGN KEY ("branch_id")
          REFERENCES "branches"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_purchase_returns_grn" ON "purchase_returns" ("grn_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_purchase_returns_supplier"
        ON "purchase_returns" ("supplier_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "purchase_return_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "purchase_return_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" numeric(12,3) NOT NULL,
        "unit_cost" numeric(12,2) NOT NULL,
        "line_total" numeric(12,2) NOT NULL,
        CONSTRAINT "PK_purchase_return_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pret_items_return" FOREIGN KEY ("purchase_return_id")
          REFERENCES "purchase_returns"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pret_items_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_pret_items_return"
        ON "purchase_return_items" ("purchase_return_id")
    `);

    this.logger.log('Created purchase_returns + purchase_return_items tables');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_return_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_returns"`);
  }
}
