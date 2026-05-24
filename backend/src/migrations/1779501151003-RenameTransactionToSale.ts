import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renames the POS Transaction tables / FK columns to Sale terminology.
 *
 * Tables:
 *   transactions       -> sales
 *   transaction_items  -> sale_items
 *
 * FK columns:
 *   sale_items.transaction_id        -> sale_id
 *   ledger_entries.transaction_id    -> sale_id
 *   pos_idempotency_keys.transaction_id -> sale_id
 *
 * Phase 0 of the Shanel cashier-POS port. Pure rename — no behavior change.
 */
export class RenameTransactionToSale1779501151003 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.renameTable('transactions', 'sales');
    await qr.renameTable('transaction_items', 'sale_items');
    await qr.renameColumn('sale_items', 'transaction_id', 'sale_id');
    await qr.renameColumn('ledger_entries', 'transaction_id', 'sale_id');
    await qr.renameColumn('pos_idempotency_keys', 'transaction_id', 'sale_id');
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.renameColumn('pos_idempotency_keys', 'sale_id', 'transaction_id');
    await qr.renameColumn('ledger_entries', 'sale_id', 'transaction_id');
    await qr.renameColumn('sale_items', 'sale_id', 'transaction_id');
    await qr.renameTable('sale_items', 'transaction_items');
    await qr.renameTable('sales', 'transactions');
  }
}
