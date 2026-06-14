import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 3 — chart of accounts + account dimension on the ledger.
 *
 * Seeds the system accounts (stable codes the posting paths reference),
 * adds `ledger_entries.account_id`, and backfills historical rows with
 * the SAME rules `classifyLedgerAccount` applies at runtime:
 *   GRN-/PRET-  → 1300 Inventory
 *   CRPAY-      → 1000 Cash
 *   EXP-        → 6000 Operating Expenses
 *   RET-        → 4000 Sales Revenue (contra)
 *   sale_id set → 4000 Sales Revenue
 *   fallback    → credit 4900 Other Income / debit 6000 Operating Expenses
 */
export class CreateAccountsAndLedgerDimension1779731300000 implements MigrationInterface {
  name = 'CreateAccountsAndLedgerDimension1779731300000';
  private readonly logger = new Logger(
    CreateAccountsAndLedgerDimension1779731300000.name,
  );

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(8) NOT NULL,
        "name" varchar(80) NOT NULL,
        "type" varchar(16) NOT NULL,
        "is_system" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accounts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_accounts_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "accounts" ("code", "name", "type", "is_system") VALUES
        ('1000', 'Cash', 'Asset', true),
        ('1100', 'Bank', 'Asset', true),
        ('1200', 'Accounts Receivable', 'Asset', true),
        ('1300', 'Inventory', 'Asset', true),
        ('2000', 'Accounts Payable', 'Liability', true),
        ('3000', 'Owner''s Equity', 'Equity', true),
        ('4000', 'Sales Revenue', 'Income', true),
        ('4900', 'Other Income', 'Income', true),
        ('5000', 'Cost of Goods Sold', 'Expense', true),
        ('6000', 'Operating Expenses', 'Expense', true)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      ALTER TABLE "ledger_entries" ADD COLUMN "account_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "ledger_entries"
        ADD CONSTRAINT "FK_ledger_entries_account"
        FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
        ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ledger_entries_account"
        ON "ledger_entries" ("account_id")
    `);

    // Backfill — keep in lockstep with classifyLedgerAccount().
    await queryRunner.query(`
      UPDATE "ledger_entries" le SET "account_id" = a.id
      FROM "accounts" a
      WHERE le."account_id" IS NULL
        AND a."code" = CASE
          WHEN le."reference_number" LIKE 'GRN-%'
            OR le."reference_number" LIKE 'PRET-%' THEN '1300'
          WHEN le."reference_number" LIKE 'CRPAY-%' THEN '1000'
          WHEN le."reference_number" LIKE 'EXP-%' THEN '6000'
          WHEN le."reference_number" LIKE 'RET-%' THEN '4000'
          WHEN le."sale_id" IS NOT NULL THEN '4000'
          WHEN le."entry_type" = 'credit' THEN '4900'
          ELSE '6000'
        END
    `);

    this.logger.log('Created accounts, added ledger account dimension');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" DROP CONSTRAINT IF EXISTS "FK_ledger_entries_account"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" DROP COLUMN IF EXISTS "account_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "accounts"`);
  }
}
