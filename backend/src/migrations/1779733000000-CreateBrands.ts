import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Brand management — add a product brand dimension for brand sales analytics.
 *
 * Adds a `brands` lookup table and nullable `products.brand` (denormalized name
 * mirror) + `products.brand_id` FK columns. Brand is OPTIONAL on a product, so
 * there's no backfill — existing rows keep a null brand until assigned via the
 * product form (which auto-creates the brand) or the seed.
 *
 * Idempotent (every step guarded) so it is safe whether or not a `DB_SYNC` boot
 * already created the table/columns, and safe to re-run.
 */
export class CreateBrands1779733000000 implements MigrationInterface {
  name = 'CreateBrands1779733000000';
  private readonly logger = new Logger(CreateBrands1779733000000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "brands" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "description" varchar,
        "color" varchar(16),
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_by_user_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_brands" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_brands_name"
        ON "brands" ("name")
    `);

    await queryRunner.query(`
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand_id" uuid
    `);

    // Add the FK once (guarded — DB_SYNC may have created it already).
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_products_brand'
        ) THEN
          ALTER TABLE "products"
            ADD CONSTRAINT "FK_products_brand"
            FOREIGN KEY ("brand_id") REFERENCES "brands"("id")
            ON DELETE RESTRICT;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_brand_id"
        ON "products" ("brand_id")
    `);

    this.logger.log('brands table created + products.brand columns added');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_brand"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_brand_id"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "brand_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "brand"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "brands"`);
  }
}
