import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mid-shift cash drawer movements (pay-in / pay-out) plus their snapshot
 * totals on the shift. These feed the drawer reconciliation:
 * expectedCash = openingFloat + cash takings − refunds + payIn − payOut.
 */
export class AddPosCashMovements1779732400000 implements MigrationInterface {
  name = 'AddPosCashMovements1779732400000';
  private readonly logger = new Logger(AddPosCashMovements1779732400000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pos_cash_movements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "shift_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "cashier_id" uuid NOT NULL,
        "type" varchar(16) NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "reason" varchar(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pos_cash_movements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pos_cash_movements_shift" FOREIGN KEY ("shift_id")
          REFERENCES "pos_shifts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pos_cash_movements_shift"
        ON "pos_cash_movements" ("shift_id")
    `);
    await queryRunner.query(
      `ALTER TABLE "pos_shifts" ADD COLUMN IF NOT EXISTS "total_pay_in" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_shifts" ADD COLUMN IF NOT EXISTS "total_pay_out" numeric(12,2)`,
    );
    this.logger.log(
      'Created pos_cash_movements + total_pay_in/total_pay_out on pos_shifts',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_shifts" DROP COLUMN IF EXISTS "total_pay_out"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pos_shifts" DROP COLUMN IF EXISTS "total_pay_in"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "pos_cash_movements"`);
  }
}
