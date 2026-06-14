import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 2 — cashier drawer sessions. Close-time columns stay NULL while
 * the shift is Open; closing snapshots tender totals, expected cash
 * (float + cash − refunds), counted cash, and the over/short.
 */
export class CreatePosShifts1779731200000 implements MigrationInterface {
  name = 'CreatePosShifts1779731200000';
  private readonly logger = new Logger(CreatePosShifts1779731200000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "pos_shifts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "branch_id" uuid NOT NULL,
        "cashier_id" uuid NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'Open',
        "opened_at" TIMESTAMP NOT NULL DEFAULT now(),
        "closed_at" TIMESTAMP,
        "opening_float" numeric(12,2) NOT NULL DEFAULT 0,
        "counted_cash" numeric(12,2),
        "expected_cash" numeric(12,2),
        "over_short" numeric(12,2),
        "total_cash" numeric(12,2),
        "total_cheque" numeric(12,2),
        "total_bank" numeric(12,2),
        "total_credit" numeric(12,2),
        "total_electronic" numeric(12,2),
        "sales_count" integer,
        "sales_total" numeric(12,2),
        "refunds_total" numeric(12,2),
        "notes" text,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pos_shifts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pos_shifts_branch" FOREIGN KEY ("branch_id")
          REFERENCES "branches"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_pos_shifts_cashier" FOREIGN KEY ("cashier_id")
          REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_pos_shifts_branch_status"
        ON "pos_shifts" ("branch_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_pos_shifts_cashier_status"
        ON "pos_shifts" ("cashier_id", "status")
    `);
    this.logger.log('Created pos_shifts table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pos_shifts"`);
  }
}
