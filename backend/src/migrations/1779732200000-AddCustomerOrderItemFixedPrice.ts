import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * "Buy by amount" for loose products: a per-line fixed price. When set, the
 * order line is charged this exact cash amount (the customer asked for e.g.
 * "1000 Rs of bananas") instead of quantity × unit price. Nullable — normal
 * by-weight / by-count lines leave it null.
 */
export class AddCustomerOrderItemFixedPrice1779732200000 implements MigrationInterface {
  name = 'AddCustomerOrderItemFixedPrice1779732200000';
  private readonly logger = new Logger(
    AddCustomerOrderItemFixedPrice1779732200000.name,
  );

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer_order_items" ADD COLUMN IF NOT EXISTS "fixed_price_override" numeric(12,2)`,
    );
    this.logger.log('Added customer_order_items.fixed_price_override');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer_order_items" DROP COLUMN IF EXISTS "fixed_price_override"`,
    );
  }
}
