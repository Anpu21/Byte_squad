import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PLU code for weigh-by-weight products: a short numeric item code embedded in
 * retail-scale barcodes (EAN-13 `2`-prefix) used to resolve a scanned weighed
 * item back to its product. Nullable — only weighed products (base unit kg/l)
 * set it. Partial-unique (where not null) so resolution by PLU is deterministic.
 */
export class AddProductPluCode1779732300000 implements MigrationInterface {
  name = 'AddProductPluCode1779732300000';
  private readonly logger = new Logger(AddProductPluCode1779732300000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "plu_code" varchar(16)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_products_plu_code" ON "products" ("plu_code") WHERE "plu_code" IS NOT NULL`,
    );
    this.logger.log('Added products.plu_code + uq_products_plu_code');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_products_plu_code"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "plu_code"`,
    );
  }
}
