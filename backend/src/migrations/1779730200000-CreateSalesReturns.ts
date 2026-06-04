import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase C3 — sales returns (invoice lookup, good/bad split, restock).
 *
 * `sales_returns` + `sales_return_items`: a partial, item-level reversal of a
 * POS sale. Good units optionally restock (Return movement); the customer is
 * refunded via a DEBIT ledger entry.
 *
 * Mirrors `backend/migrations/2026-06-04-create-sales-returns.sql`.
 */
export class CreateSalesReturns1779730200000 implements MigrationInterface {
  name = 'CreateSalesReturns1779730200000';
  private readonly logger = new Logger(CreateSalesReturns1779730200000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sales_returns" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sale_id" uuid NOT NULL,
        "invoice_number" varchar NOT NULL,
        "branch_id" uuid NOT NULL,
        "customer_user_id" uuid,
        "total_refund_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "restocked_value" numeric(12,2) NOT NULL DEFAULT 0,
        "reason" varchar(255),
        "status" varchar(32) NOT NULL DEFAULT 'Completed',
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales_returns" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sales_returns_sale" FOREIGN KEY ("sale_id")
          REFERENCES "sales"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_sales_returns_branch" FOREIGN KEY ("branch_id")
          REFERENCES "branches"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sales_returns_branch_created"
        ON "sales_returns" ("branch_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sales_returns_sale" ON "sales_returns" ("sale_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sales_returns_invoice"
        ON "sales_returns" ("invoice_number")
    `);

    await queryRunner.query(`
      CREATE TABLE "sales_return_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "return_id" uuid NOT NULL,
        "sale_item_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "good_quantity" numeric(12,3) NOT NULL,
        "bad_quantity" numeric(12,3) NOT NULL,
        "base_unit_qty_good" numeric(12,3) NOT NULL DEFAULT 0,
        "restock_good" boolean NOT NULL DEFAULT true,
        "refund_amount" numeric(12,2) NOT NULL DEFAULT 0,
        CONSTRAINT "PK_sales_return_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sales_return_items_return" FOREIGN KEY ("return_id")
          REFERENCES "sales_returns"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sales_return_items_sale_item" FOREIGN KEY ("sale_item_id")
          REFERENCES "sale_items"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sales_return_items_return"
        ON "sales_return_items" ("return_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sales_return_items_sale_item"
        ON "sales_return_items" ("sale_item_id")
    `);
    this.logger.log('Created sales_returns + sales_return_items tables');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sales_return_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales_returns"`);
  }
}
