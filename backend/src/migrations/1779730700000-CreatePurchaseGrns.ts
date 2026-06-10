import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Purchases Phase 1, slice 2 — GRN (purchase voucher) tables.
 *
 * - `purchase_doc_counters`: year-scoped sequences per document family
 *   (GRN/PO/SPAY/PRET), allocated under pessimistic write locks.
 * - `grns`: goods-received-note header. Doubles as the supplier *bill* —
 *   `paid_amount`/`payment_status` advance as payments allocate to it.
 * - `grn_items`: received lines (base-unit qty, unit cost, batch/expiry).
 */
export class CreatePurchaseGrns1779730700000 implements MigrationInterface {
  name = 'CreatePurchaseGrns1779730700000';
  private readonly logger = new Logger(CreatePurchaseGrns1779730700000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "purchase_doc_counters" (
        "doc_type" varchar(8) NOT NULL,
        "year" integer NOT NULL,
        "last_seq" integer NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_doc_counters" PRIMARY KEY ("doc_type", "year")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "grns" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "grn_number" varchar(24) NOT NULL,
        "supplier_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "purchase_order_id" uuid,
        "supplier_invoice_no" varchar(64),
        "grn_date" date NOT NULL,
        "due_date" date NOT NULL,
        "sub_total" numeric(12,2) NOT NULL,
        "discount_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "grand_total" numeric(12,2) NOT NULL,
        "paid_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "payment_status" varchar(16) NOT NULL DEFAULT 'Unpaid',
        "status" varchar(16) NOT NULL DEFAULT 'Received',
        "voided_at" TIMESTAMP,
        "voided_by_user_id" uuid,
        "void_reason" text,
        "notes" text,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_grns" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_grns_grn_number" UNIQUE ("grn_number"),
        CONSTRAINT "FK_grns_supplier" FOREIGN KEY ("supplier_id")
          REFERENCES "suppliers"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_grns_branch" FOREIGN KEY ("branch_id")
          REFERENCES "branches"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_grns_branch_date" ON "grns" ("branch_id", "grn_date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_grns_supplier" ON "grns" ("supplier_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_grns_payment_status" ON "grns" ("payment_status")
    `);

    await queryRunner.query(`
      CREATE TABLE "grn_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "grn_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" numeric(12,3) NOT NULL,
        "unit_cost" numeric(12,2) NOT NULL,
        "line_total" numeric(12,2) NOT NULL,
        "batch_no" varchar(64),
        "expiry_date" date,
        CONSTRAINT "PK_grn_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_grn_items_grn" FOREIGN KEY ("grn_id")
          REFERENCES "grns"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_grn_items_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_grn_items_grn" ON "grn_items" ("grn_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_grn_items_product" ON "grn_items" ("product_id")
    `);

    this.logger.log('Created purchase_doc_counters, grns, grn_items tables');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "grn_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "grns"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_doc_counters"`);
  }
}
