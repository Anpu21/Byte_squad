import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `invoice_counters` table — one row per calendar year holding
 * the last issued sequence number for INV-YYYY-NNNNNN invoice numbers.
 *
 * Read and incremented under a pessimistic write lock from
 * InvoiceNumberService.next() inside the createSale transaction so concurrent
 * checkouts never collide on the same invoice number.
 *
 * Schema:
 *   year           integer PRIMARY KEY — calendar year (e.g. 2026)
 *   last_seq       integer            — last issued sequence for that year
 *   updated_at     timestamp          — TypeORM @UpdateDateColumn maintains
 *
 * Reversible: down() drops the table.
 */
export class CreateInvoiceCounters1779504870000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE invoice_counters (
        year integer PRIMARY KEY,
        last_seq integer NOT NULL DEFAULT 0,
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS invoice_counters`);
  }
}
