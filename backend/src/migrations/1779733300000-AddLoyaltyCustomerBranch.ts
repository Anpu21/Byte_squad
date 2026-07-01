import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add `loyalty_customers.branch_id` (a walk-in's "home branch"). It is set at
 * enrol time from the cashier's branch so a freshly enrolled member shows up in
 * that branch's loyalty list *before* their first sale writes a branch-carrying
 * ledger row. Nullable — pre-existing walk-ins and admin-initiated enrols keep
 * null and surface only via ledger activity, exactly as before. Idempotent; dev
 * uses `DB_SYNC` (adds the column on boot), prod runs this.
 */
export class AddLoyaltyCustomerBranch1779733300000
  implements MigrationInterface
{
  name = 'AddLoyaltyCustomerBranch1779733300000';
  private readonly logger = new Logger(
    AddLoyaltyCustomerBranch1779733300000.name,
  );

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_customers" ADD COLUMN IF NOT EXISTS "branch_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_loyalty_customers_branch_id" ON "loyalty_customers" ("branch_id")`,
    );
    this.logger.log(
      'Added loyalty_customers.branch_id (walk-in home branch) + index',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_loyalty_customers_branch_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_customers" DROP COLUMN IF EXISTS "branch_id"`,
    );
  }
}
