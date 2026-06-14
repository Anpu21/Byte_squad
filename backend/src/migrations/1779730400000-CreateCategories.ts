import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Category management — normalize product categories.
 *
 * Adds a `categories` lookup table and a `products.category_id` FK, then
 * backfills: one category row per distinct existing `products.category` string,
 * linking every product to its row. `products.category` stays as a synced
 * denormalized mirror so existing readers keep working.
 *
 * Idempotent (every step guarded) so it is safe whether or not a `DB_SYNC`
 * boot already created the table/column, and safe to re-run.
 */
export class CreateCategories1779730400000 implements MigrationInterface {
  name = 'CreateCategories1779730400000';
  private readonly logger = new Logger(CreateCategories1779730400000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "description" varchar,
        "color" varchar(16),
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_categories_name"
        ON "categories" ("name")
    `);

    await queryRunner.query(`
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" uuid
    `);

    // Backfill — one category per distinct product category string, attributed
    // to an admin (any user as a fallback). No-op on a fresh DB (no products).
    await queryRunner.query(`
      INSERT INTO "categories" ("name", "created_by_user_id")
      SELECT DISTINCT p."category",
        COALESCE(
          (SELECT u."id" FROM "users" u WHERE u."role" = 'admin'
             ORDER BY u."created_at" LIMIT 1),
          (SELECT u2."id" FROM "users" u2 ORDER BY u2."created_at" LIMIT 1)
        )
      FROM "products" p
      WHERE p."category" IS NOT NULL AND p."category" <> ''
        AND NOT EXISTS (
          SELECT 1 FROM "categories" c WHERE c."name" = p."category"
        )
    `);
    await queryRunner.query(`
      UPDATE "products" p
      SET "category_id" = c."id"
      FROM "categories" c
      WHERE c."name" = p."category" AND p."category_id" IS NULL
    `);

    // Add the FK once (guarded — DB_SYNC may have created it already).
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_products_category'
        ) THEN
          ALTER TABLE "products"
            ADD CONSTRAINT "FK_products_category"
            FOREIGN KEY ("category_id") REFERENCES "categories"("id")
            ON DELETE RESTRICT;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_category_id"
        ON "products" ("category_id")
    `);

    this.logger.log('categories table created + products backfilled');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_category"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_category_id"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "category_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
