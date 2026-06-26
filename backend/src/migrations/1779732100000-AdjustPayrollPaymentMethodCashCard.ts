import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Payroll is paid out only in Cash or Card — there is no bank rail. Narrow
 * `payrolls.payment_method` from the old bank-centric set
 * (`Cash` / `Bank_Transfer` / `Cheque`, default `Bank_Transfer`) down to
 * `Cash` / `Card` (default `Cash`), remapping existing rows, and de-bankify
 * the optional reference column (`bank_reference_no` → `payment_reference`).
 *
 * `payment_method` is a native Postgres enum, so the allowed set is changed by
 * swapping the enum TYPE — rename the old type aside, create the narrowed one,
 * recast the column with a remapping `USING`, drop the old type — not by
 * editing a CHECK constraint (there is none). This leaves the column as the
 * `('Cash','Card')` enum the entity declares, so a synchronize-built dev schema
 * and a migrated prod schema match. All DDL here is transactional. Reversible.
 */
export class AdjustPayrollPaymentMethodCashCard1779732100000 implements MigrationInterface {
  name = 'AdjustPayrollPaymentMethodCashCard1779732100000';
  private readonly logger = new Logger(
    AdjustPayrollPaymentMethodCashCard1779732100000.name,
  );

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The column default references the old enum — drop it before the swap.
    await queryRunner.query(
      `ALTER TABLE "payrolls" ALTER COLUMN "payment_method" DROP DEFAULT`,
    );
    // No CHECK exists in prod (the column is an enum), but drop one defensively
    // so a dev/test DB that ever grew one doesn't block the recast below.
    await queryRunner.query(
      `ALTER TABLE "payrolls" DROP CONSTRAINT IF EXISTS "ck_payrolls_payment_method"`,
    );
    // Swap the enum type: rename the old one aside, create the narrowed set.
    await queryRunner.query(
      `ALTER TYPE "payrolls_payment_method_enum" RENAME TO "payrolls_payment_method_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "payrolls_payment_method_enum" AS ENUM ('Cash', 'Card')`,
    );
    // Recast the column, remapping legacy methods onto the Cash/Card model:
    // electronic bank transfer → Card, paper cheque → Cash.
    await queryRunner.query(
      `ALTER TABLE "payrolls"
         ALTER COLUMN "payment_method" TYPE "payrolls_payment_method_enum"
         USING (
           CASE "payment_method"::text
             WHEN 'Bank_Transfer' THEN 'Card'
             WHEN 'Cheque' THEN 'Cash'
             ELSE 'Cash'
           END
         )::"payrolls_payment_method_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payrolls" ALTER COLUMN "payment_method" SET DEFAULT 'Cash'`,
    );
    await queryRunner.query(`DROP TYPE "payrolls_payment_method_enum_old"`);
    // De-bankify the optional reference column.
    await queryRunner.query(
      `ALTER TABLE "payrolls" RENAME COLUMN "bank_reference_no" TO "payment_reference"`,
    );
    this.logger.log(
      'payrolls.payment_method enum → Cash/Card; bank_reference_no → payment_reference',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payrolls" RENAME COLUMN "payment_reference" TO "bank_reference_no"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payrolls" ALTER COLUMN "payment_method" DROP DEFAULT`,
    );
    // Restore the original bank-centric enum and recast back. `Card` has no
    // pre-migration equivalent, so fold it onto Bank_Transfer.
    await queryRunner.query(
      `ALTER TYPE "payrolls_payment_method_enum" RENAME TO "payrolls_payment_method_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "payrolls_payment_method_enum" AS ENUM ('Cash', 'Bank_Transfer', 'Cheque')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payrolls"
         ALTER COLUMN "payment_method" TYPE "payrolls_payment_method_enum"
         USING (
           CASE "payment_method"::text
             WHEN 'Card' THEN 'Bank_Transfer'
             ELSE 'Cash'
           END
         )::"payrolls_payment_method_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payrolls" ALTER COLUMN "payment_method" SET DEFAULT 'Bank_Transfer'`,
    );
    await queryRunner.query(`DROP TYPE "payrolls_payment_method_enum_old"`);
  }
}