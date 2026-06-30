import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Customer pickup orders: add a `not_collected` (no-show) status. After the
 * manager approve/reject gate was removed, an awaiting order is either
 * collected (fulfilled → `completed`) or marked `not_collected` by the cashier.
 *
 * Postgres can't drop an enum value, so `down` is a no-op — the value simply
 * stays available, which is harmless.
 */
export class AddCustomerOrderNotCollectedStatus1779731900000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TYPE customer_orders_status_enum
        ADD VALUE IF NOT EXISTS 'not_collected'
    `);
  }

  public async down(): Promise<void> {
    // Postgres does not support removing a value from an enum type; leaving
    // 'not_collected' in place is harmless and keeps existing rows valid.
  }
}
