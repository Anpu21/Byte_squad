import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the optional `mrp` (Maximum Retail Price) column to products. Surfaced
 * on the POS billing grid + receipt. Dev runs with `synchronize`, so this
 * column auto-appears there; the migration keeps production correct.
 */
export class AddProductMrp1779730600000 implements MigrationInterface {
  name = 'AddProductMrp1779730600000';
  private readonly logger = new Logger(AddProductMrp1779730600000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "mrp" numeric(12,2)`,
    );
    this.logger.log('Added products.mrp');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "mrp"`,
    );
  }
}
