import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop the stale `loyalty_ledger_entries.order_id -> customer_orders(id)` FK.
 *
 * `order_id` was originally a TypeORM `@ManyToOne(() => CustomerOrder)` (auto FK
 * `FK_2bc8103d0a1adb22e00a1ced062`, created by legacy `synchronize`) back when
 * loyalty was online-store-only. The POS sale path reuses the same earn/redeem
 * code but writes a `sales` id into `order_id`, which has no `customer_orders`
 * row -> FK violation -> the entire POS sale rolls back (500) on every loyalty
 * sale.
 *
 * `order_id` is now a polymorphic reference (POS `sales` id OR online
 * `customer_orders` id) with the human-readable code denormalized into
 * `metadata.orderCode`, so the single-table FK is removed. Idempotent; dev uses
 * `DB_SYNC` (drops the now-undeclared FK on boot), prod runs this.
 */
export class DropLoyaltyLedgerOrderFk1779733200000
  implements MigrationInterface
{
  name = 'DropLoyaltyLedgerOrderFk1779733200000';
  private readonly logger = new Logger(
    DropLoyaltyLedgerOrderFk1779733200000.name,
  );

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_ledger_entries" DROP CONSTRAINT IF EXISTS "FK_2bc8103d0a1adb22e00a1ced062"`,
    );
    this.logger.log(
      'Dropped loyalty_ledger_entries.order_id -> customer_orders FK; order_id is now polymorphic (sales | customer_orders)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort restore: NOT VALID so existing POS-sale order_ids (which have
    // no customer_orders row) don't fail the constraint check on re-add.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_2bc8103d0a1adb22e00a1ced062'
        ) THEN
          ALTER TABLE "loyalty_ledger_entries"
            ADD CONSTRAINT "FK_2bc8103d0a1adb22e00a1ced062"
            FOREIGN KEY ("order_id") REFERENCES "customer_orders"("id")
            ON DELETE SET NULL NOT VALID;
        END IF;
      END $$;
    `);
  }
}
