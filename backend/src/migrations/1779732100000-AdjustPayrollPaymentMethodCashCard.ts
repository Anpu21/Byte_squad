import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Payroll is paid out only in Cash or Card — there is no bank rail. Narrow
 * `payrolls.payment_method` from the old bank-centric set
 * (`Cash` / `Bank_Transfer` / `Cheque`, default `Bank_Transfer`) down to
 * `Cash` / `Card` (default `Cash`), remapping existing rows so they satisfy
 * the new CHECK, and de-bankify the optional reference column
 * (`bank_reference_no` → `payment_reference`). Reversible.
 */
export class AdjustPayrollPaymentMethodCashCard1779732100000
  implements MigrationInterface
{
  name = 'AdjustPayrollPaymentMethodCashCard1779732100000';
  private readonly logger = new Logger(
    AdjustPayrollPaymentMethodCashCard1779732100000.name,
  );

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old CHECK first — it still forbids 'Card', so the remap below
    // would violate it otherwise. Then remap legacy methods onto the
    // Cash/Card model: electronic bank transfer → Card, paper cheque → Cash.
    await queryRunner.query(
      `ALTER TABLE "payrolls" DROP CONSTRAINT IF EXISTS "ck_payrolls_payment_method"`,
    );
    await queryRunner.query(
      `UPDATE "payrolls" SET "payment_method" = 'Card' WHERE "payment_method" = 'Bank_Transfer'`,
    );
    await queryRunner.query(
      `UPDATE "payrolls" SET "payment_method" = 'Cash' WHERE "payment_method" = 'Cheque'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payrolls" ALTER COLUMN "payment_method" SET DEFAULT 'Cash'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payrolls" ADD CONSTRAINT "ck_payrolls_payment_method" CHECK ("payment_method" IN ('Cash', 'Card'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payrolls" RENAME COLUMN "bank_reference_no" TO "payment_reference"`,
    );
    this.logger.log(
      'payrolls.payment_method → Cash/Card; bank_reference_no → payment_reference',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payrolls" RENAME COLUMN "payment_reference" TO "bank_reference_no"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payrolls" DROP CONSTRAINT IF EXISTS "ck_payrolls_payment_method"`,
    );
    // `Card` has no pre-migration equivalent; fold it back to Bank_Transfer.
    await queryRunner.query(
      `UPDATE "payrolls" SET "payment_method" = 'Bank_Transfer' WHERE "payment_method" = 'Card'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payrolls" ALTER COLUMN "payment_method" SET DEFAULT 'Bank_Transfer'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payrolls" ADD CONSTRAINT "ck_payrolls_payment_method" CHECK ("payment_method" IN ('Cash', 'Bank_Transfer', 'Cheque'))`,
    );
  }
}
