import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase D — multi-branch customer-order checkout + units.
 *
 * - `customer_orders.group_code`: links the per-branch orders created from one
 *   multi-branch checkout so a single PayHere payment settles them together.
 * - `customer_order_items`: capture the chosen sellable unit (`unit_id`,
 *   `unit_label`) and the resolved base-unit quantity (`base_unit_qty`) used
 *   when decrementing inventory; widen `quantity` to numeric for weighed units.
 */
export class AddCustomerOrderGroupsAndUnits1779730300000 implements MigrationInterface {
  name = 'AddCustomerOrderGroupsAndUnits1779730300000';
  private readonly logger = new Logger(
    AddCustomerOrderGroupsAndUnits1779730300000.name,
  );

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer_orders" ADD COLUMN IF NOT EXISTS "group_code" varchar`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_customer_orders_group_code" ON "customer_orders" ("group_code")`,
    );

    await queryRunner.query(
      `ALTER TABLE "customer_order_items" ADD COLUMN IF NOT EXISTS "unit_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_order_items" ADD COLUMN IF NOT EXISTS "unit_label" varchar(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_order_items" ADD COLUMN IF NOT EXISTS "base_unit_qty" numeric(12,3) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_order_items" ALTER COLUMN "quantity" TYPE numeric(12,3)`,
    );
    // Backfill base-unit qty for pre-existing rows (1 unit = 1 base unit).
    await queryRunner.query(
      `UPDATE "customer_order_items" SET "base_unit_qty" = "quantity" WHERE "base_unit_qty" = 0`,
    );

    this.logger.log(
      'Added customer-order group_code + order-item unit columns',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer_order_items" DROP COLUMN IF EXISTS "base_unit_qty"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_order_items" DROP COLUMN IF EXISTS "unit_label"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_order_items" DROP COLUMN IF EXISTS "unit_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_order_items" ALTER COLUMN "quantity" TYPE integer USING ROUND("quantity")`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_customer_orders_group_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "group_code"`,
    );
  }
}
