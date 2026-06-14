import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Purchases Phase 1, slice 4 — supplier payment vouchers with bill-by-bill
 * allocation. `supplier_payment_allocations.grn_id` is nullable: a null
 * slice settles the supplier's opening balance (pre-system debt with no
 * GRN behind it).
 */
export class CreateSupplierPayments1779730800000 implements MigrationInterface {
  name = 'CreateSupplierPayments1779730800000';
  private readonly logger = new Logger(
    CreateSupplierPayments1779730800000.name,
  );

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "supplier_payments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "payment_number" varchar(24) NOT NULL,
        "supplier_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "method" varchar(16) NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "paid_at" date NOT NULL,
        "notes" text,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_supplier_payments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_supplier_payments_number" UNIQUE ("payment_number"),
        CONSTRAINT "FK_supplier_payments_supplier" FOREIGN KEY ("supplier_id")
          REFERENCES "suppliers"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_supplier_payments_branch" FOREIGN KEY ("branch_id")
          REFERENCES "branches"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_supplier_payments_supplier"
        ON "supplier_payments" ("supplier_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_supplier_payments_branch_paid"
        ON "supplier_payments" ("branch_id", "paid_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "supplier_payment_allocations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "payment_id" uuid NOT NULL,
        "grn_id" uuid,
        "amount" numeric(12,2) NOT NULL,
        CONSTRAINT "PK_supplier_payment_allocations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spa_payment" FOREIGN KEY ("payment_id")
          REFERENCES "supplier_payments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spa_grn" FOREIGN KEY ("grn_id")
          REFERENCES "grns"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_spa_payment"
        ON "supplier_payment_allocations" ("payment_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_spa_grn"
        ON "supplier_payment_allocations" ("grn_id")
    `);

    this.logger.log(
      'Created supplier_payments and supplier_payment_allocations tables',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "supplier_payment_allocations"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "supplier_payments"`);
  }
}
