import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Indexes on `sale_items` for the branch-analytics product×branch comparison
 * (POST /branch-analytics/products). That aggregation joins sale_items → sales
 * and groups/filters by product_id, and Postgres does not auto-index FK
 * columns. Index names match the `@Index` decorators on the SaleItem entity so
 * dev (DB_SYNC) and prod (this migration) converge on the same indexes.
 * Idempotent.
 */
export class SaleItemsProductReportingIndexes1779733400000 implements MigrationInterface {
  name = 'SaleItemsProductReportingIndexes1779733400000';
  private readonly logger = new Logger(
    SaleItemsProductReportingIndexes1779733400000.name,
  );

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_sale_items_sale_id" ON "sale_items" ("sale_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_sale_items_product_id" ON "sale_items" ("product_id")`,
    );
    this.logger.log('Added sale_items reporting indexes (sale_id, product_id)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sale_items_product_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sale_items_sale_id"`);
  }
}
