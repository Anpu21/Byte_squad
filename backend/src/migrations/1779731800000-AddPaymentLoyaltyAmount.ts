import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * POS loyalty redemption — record the points-funded portion of a sale on
 * the Payment row. Redemption settles like a non-cash tender, so
 * `cash + cheque + bank + credit + loyalty_amount` reconciles to the gross
 * `invoice_total` and the Sale's `total`/tax/ledger revenue stay at gross.
 *
 * Additive and reversible. The `NOT NULL DEFAULT 0` keeps every existing
 * payment row valid without a backfill.
 */
export class AddPaymentLoyaltyAmount1779731800000
  implements MigrationInterface
{
  name = 'AddPaymentLoyaltyAmount1779731800000';
  private readonly logger = new Logger(AddPaymentLoyaltyAmount1779731800000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN "loyalty_amount" numeric(12,2) NOT NULL DEFAULT 0
    `);
    this.logger.log('Added payments.loyalty_amount');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments" DROP COLUMN IF EXISTS "loyalty_amount"
    `);
  }
}
