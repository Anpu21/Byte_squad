import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 3 — fiscal period locking + the ledger business date.
 *
 * `ledger_entries.entry_date` is the date the posting belongs to
 * (backfilled from created_at); the financial reports and the period
 * locks key on it. `fiscal_period_locks` rows mark closed months.
 */
export class CreateFiscalPeriodLocks1779731500000 implements MigrationInterface {
  name = 'CreateFiscalPeriodLocks1779731500000';
  private readonly logger = new Logger(
    CreateFiscalPeriodLocks1779731500000.name,
  );

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ledger_entries"
        ADD COLUMN "entry_date" date
    `);
    await queryRunner.query(`
      UPDATE "ledger_entries" SET "entry_date" = "created_at"::date
    `);
    await queryRunner.query(`
      ALTER TABLE "ledger_entries"
        ALTER COLUMN "entry_date" SET NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ledger_entries_entry_date"
        ON "ledger_entries" ("entry_date")
    `);

    await queryRunner.query(`
      CREATE TABLE "fiscal_period_locks" (
        "year" integer NOT NULL,
        "month" integer NOT NULL,
        "locked_by_user_id" uuid NOT NULL,
        "locked_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fiscal_period_locks" PRIMARY KEY ("year", "month")
      )
    `);

    this.logger.log('Added ledger entry_date + fiscal_period_locks');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "fiscal_period_locks"`);
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" DROP COLUMN IF EXISTS "entry_date"`,
    );
  }
}
