import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Customer store-credit ("khata"/loan-book) module.
 *
 * Adds:
 *  - `credit_accounts` — the per-customer credit account (branch-owned, with an
 *    approval lifecycle, credit limit + repayment term, and running balance).
 *  - `credit_account_transactions` — the append-only loan-book ledger.
 *  - `sales.credit_account_id` / `sales.due_date` /
 *    `sales.credit_override_by_user_id` — links a credit sale to an account,
 *    stamps its repayment due date, and audits an over-limit override.
 *
 * Idempotent (every step guarded) so it is safe whether or not a `DB_SYNC` boot
 * already created the objects, and safe to re-run.
 */
export class CreateCreditAccounts1779733100000 implements MigrationInterface {
  name = 'CreateCreditAccounts1779733100000';
  private readonly logger = new Logger(CreateCreditAccounts1779733100000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── credit_accounts ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "credit_accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "account_no" varchar(24) NOT NULL,
        "holder_name" varchar NOT NULL,
        "phone" varchar(16) NOT NULL,
        "nic" varchar(32),
        "address" text,
        "branch_id" uuid NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'PENDING',
        "credit_limit" numeric(12,2),
        "credit_term_days" integer,
        "current_balance" numeric(12,2) NOT NULL DEFAULT 0,
        "requested_credit_limit" numeric(12,2),
        "user_id" uuid,
        "loyalty_customer_id" uuid,
        "requested_by_user_id" uuid NOT NULL,
        "reviewed_by_user_id" uuid,
        "reviewed_at" TIMESTAMP,
        "request_note" text,
        "approval_note" text,
        "rejection_reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_credit_accounts" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_credit_accounts_account_no"
        ON "credit_accounts" ("account_no")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_credit_accounts_branch_phone"
        ON "credit_accounts" ("branch_id", "phone")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_credit_accounts_branch_status"
        ON "credit_accounts" ("branch_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_credit_accounts_status_created"
        ON "credit_accounts" ("status", "created_at")
    `);
    await this.addConstraint(
      queryRunner,
      'FK_credit_accounts_branch',
      `ALTER TABLE "credit_accounts" ADD CONSTRAINT "FK_credit_accounts_branch"
         FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT`,
    );
    await this.addConstraint(
      queryRunner,
      'FK_credit_accounts_requested_by',
      `ALTER TABLE "credit_accounts" ADD CONSTRAINT "FK_credit_accounts_requested_by"
         FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
    await this.addConstraint(
      queryRunner,
      'FK_credit_accounts_reviewed_by',
      `ALTER TABLE "credit_accounts" ADD CONSTRAINT "FK_credit_accounts_reviewed_by"
         FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );

    // ── credit_account_transactions ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "credit_account_transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "credit_account_id" uuid NOT NULL,
        "sale_id" uuid,
        "transaction_type" varchar(32) NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "running_balance" numeric(12,2) NOT NULL,
        "reference_no" varchar(64) NOT NULL,
        "notes" varchar(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_credit_account_transactions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_credit_account_txn_account_created"
        ON "credit_account_transactions" ("credit_account_id", "created_at")
    `);
    await this.addConstraint(
      queryRunner,
      'FK_credit_account_txn_account',
      `ALTER TABLE "credit_account_transactions" ADD CONSTRAINT "FK_credit_account_txn_account"
         FOREIGN KEY ("credit_account_id") REFERENCES "credit_accounts"("id") ON DELETE RESTRICT`,
    );
    await this.addConstraint(
      queryRunner,
      'FK_credit_account_txn_sale',
      `ALTER TABLE "credit_account_transactions" ADD CONSTRAINT "FK_credit_account_txn_sale"
         FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL`,
    );

    // ── sales credit columns ─────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "credit_account_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "due_date" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "credit_override_by_user_id" uuid`,
    );
    await this.addConstraint(
      queryRunner,
      'FK_sales_credit_account',
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_sales_credit_account"
         FOREIGN KEY ("credit_account_id") REFERENCES "credit_accounts"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_credit_account_id"
        ON "sales" ("credit_account_id")
    `);

    this.logger.log(
      'credit_accounts + credit_account_transactions created; sales credit columns added',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "FK_sales_credit_account"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_credit_account_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" DROP COLUMN IF EXISTS "credit_override_by_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" DROP COLUMN IF EXISTS "due_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" DROP COLUMN IF EXISTS "credit_account_id"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "credit_account_transactions"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "credit_accounts"`);
  }

  /** Add a named constraint once — guarded so DB_SYNC (dev) and this migration
   * (prod) converge on a single object instead of erroring on a duplicate. */
  private async addConstraint(
    queryRunner: QueryRunner,
    constraintName: string,
    ddl: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = '${constraintName}'
        ) THEN
          ${ddl};
        END IF;
      END $$;
    `);
  }
}
