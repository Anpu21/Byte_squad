import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `credit_transactions` audit log for customer store-credit
 * activity (credit_taken when the POS extends credit on an under-paid sale,
 * credit_paid when the customer pays it back).
 *
 * - user_id  FK -> users(id) ON DELETE RESTRICT
 * - sale_id  FK -> sales(id) ON DELETE SET NULL (nullable)
 * - Indexes on user_id and sale_id
 */
export class CreateCreditTransactions1779504868000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE credit_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        sale_id uuid NULL REFERENCES sales(id) ON DELETE SET NULL,
        transaction_type varchar(32) NOT NULL,
        amount decimal(12,2) NOT NULL,
        running_balance decimal(12,2) NOT NULL,
        reference_no varchar(64) NOT NULL,
        notes varchar(255) NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX idx_ct_user ON credit_transactions (user_id)`);
    await qr.query(`CREATE INDEX idx_ct_sale ON credit_transactions (sale_id)`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_ct_sale`);
    await qr.query(`DROP INDEX IF EXISTS idx_ct_user`);
    await qr.query(`DROP TABLE IF EXISTS credit_transactions`);
  }
}
