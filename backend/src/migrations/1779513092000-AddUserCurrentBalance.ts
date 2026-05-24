import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the `current_balance` column to `users` so the POS credit-ledger flow
 * (Shanel port) has a per-customer running balance anchor. Stored as
 * decimal(12,2) NOT NULL DEFAULT 0 so all existing customer rows pick up a
 * zero balance without backfill.
 *
 * Reversible: down() drops the column.
 */
export class AddUserCurrentBalance1779513092000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE users
        ADD COLUMN current_balance decimal(12,2) NOT NULL DEFAULT 0
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE users DROP COLUMN IF EXISTS current_balance`);
  }
}
