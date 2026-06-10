import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 3 — manual journal vouchers. The header lives in
 * `journal_vouchers`; lines are real `ledger_entries` rows tagged with
 * `journal_voucher_id` so the ledger and financial reports see them
 * like any system posting. `journal_counters` numbers them per year.
 */
export class CreateJournalVouchers1779731400000 implements MigrationInterface {
  name = 'CreateJournalVouchers1779731400000';
  private readonly logger = new Logger(CreateJournalVouchers1779731400000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "journal_counters" (
        "year" integer NOT NULL,
        "last_seq" integer NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_journal_counters" PRIMARY KEY ("year")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "journal_vouchers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "voucher_number" varchar(24) NOT NULL,
        "branch_id" uuid NOT NULL,
        "entry_date" date NOT NULL,
        "memo" varchar(500) NOT NULL,
        "total" numeric(12,2) NOT NULL,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_journal_vouchers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_journal_vouchers_number" UNIQUE ("voucher_number"),
        CONSTRAINT "FK_journal_vouchers_branch" FOREIGN KEY ("branch_id")
          REFERENCES "branches"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_journal_vouchers_branch"
        ON "journal_vouchers" ("branch_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "ledger_entries" ADD COLUMN "journal_voucher_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "ledger_entries"
        ADD CONSTRAINT "FK_ledger_entries_journal"
        FOREIGN KEY ("journal_voucher_id")
        REFERENCES "journal_vouchers"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ledger_entries_journal"
        ON "ledger_entries" ("journal_voucher_id")
    `);

    this.logger.log('Created journal_vouchers + journal_counters');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" DROP CONSTRAINT IF EXISTS "FK_ledger_entries_journal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" DROP COLUMN IF EXISTS "journal_voucher_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_vouchers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_counters"`);
  }
}
