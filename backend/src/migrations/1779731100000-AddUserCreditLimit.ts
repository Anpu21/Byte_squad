import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 2 receivables — per-customer credit limit. NULL keeps the
 * previous "unlimited" behavior; a value caps `current_balance` at POS
 * checkout when credit is taken.
 */
export class AddUserCreditLimit1779731100000 implements MigrationInterface {
  name = 'AddUserCreditLimit1779731100000';
  private readonly logger = new Logger(AddUserCreditLimit1779731100000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "credit_limit" numeric(12,2)
    `);
    this.logger.log('Added users.credit_limit');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "credit_limit"
    `);
  }
}
