import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Purchases Phase 1, slice 3 — purchase orders (intent only, no stock or
 * ledger effect). Also adds the deferred FK from `grns.purchase_order_id`
 * now that the target table exists.
 */
export class CreatePurchaseOrders1779730900000 implements MigrationInterface {
  name = 'CreatePurchaseOrders1779730900000';
  private readonly logger = new Logger(CreatePurchaseOrders1779730900000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "purchase_orders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "po_number" varchar(24) NOT NULL,
        "supplier_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'Draft',
        "expected_date" date,
        "total_value" numeric(12,2) NOT NULL,
        "notes" text,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_orders" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_purchase_orders_number" UNIQUE ("po_number"),
        CONSTRAINT "FK_purchase_orders_supplier" FOREIGN KEY ("supplier_id")
          REFERENCES "suppliers"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_purchase_orders_branch" FOREIGN KEY ("branch_id")
          REFERENCES "branches"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_purchase_orders_branch_status"
        ON "purchase_orders" ("branch_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_purchase_orders_supplier"
        ON "purchase_orders" ("supplier_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "purchase_order_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "purchase_order_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" numeric(12,3) NOT NULL,
        "unit_cost" numeric(12,2) NOT NULL,
        CONSTRAINT "PK_purchase_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_po_items_order" FOREIGN KEY ("purchase_order_id")
          REFERENCES "purchase_orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_po_items_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_po_items_order"
        ON "purchase_order_items" ("purchase_order_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "grns"
        ADD CONSTRAINT "FK_grns_purchase_order"
        FOREIGN KEY ("purchase_order_id")
        REFERENCES "purchase_orders"("id") ON DELETE SET NULL
    `);

    this.logger.log('Created purchase_orders + purchase_order_items tables');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "grns" DROP CONSTRAINT IF EXISTS "FK_grns_purchase_order"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_order_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_orders"`);
  }
}
