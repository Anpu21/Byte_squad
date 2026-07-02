import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Exchange (even / upcharge / cheaper swap) linkage columns. All nullable or
 * defaulted and idempotent; dev uses `DB_SYNC` (adds them on boot), prod runs
 * this for parity.
 * - `sales_returns.type`               : 'Refund' | 'Exchange'
 * - `sales_returns.replacement_sale_id`: the replacement Sale for an exchange
 * - `sales.exchange_return_id`         : back-link flagging a replacement sale
 */
export class AddExchangeColumns1779733600000 implements MigrationInterface {
  name = 'AddExchangeColumns1779733600000';
  private readonly logger = new Logger(AddExchangeColumns1779733600000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales_returns" ADD COLUMN IF NOT EXISTS "type" varchar(16) NOT NULL DEFAULT 'Refund'`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_returns" ADD COLUMN IF NOT EXISTS "replacement_sale_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "exchange_return_id" uuid`,
    );
    this.logger.log('Added exchange linkage columns (sales_returns, sales)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales" DROP COLUMN IF EXISTS "exchange_return_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_returns" DROP COLUMN IF EXISTS "replacement_sale_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_returns" DROP COLUMN IF EXISTS "type"`,
    );
  }
}
