import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Product reviews & ratings. Verified buyers rate 1–5★ + write an optional
 * review; exactly one row per (product, customer). Denormalized avg_rating /
 * review_count on products are recomputed by ReviewsService on every write so
 * the catalog + product page render stars with no extra query. Soft-hide
 * (status='hidden') drops a row from the aggregate while the unique key still
 * blocks re-posting to evade moderation.
 */
export class CreateProductReviews1779732600000 implements MigrationInterface {
  name = 'CreateProductReviews1779732600000';
  private readonly logger = new Logger(CreateProductReviews1779732600000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN IF NOT EXISTS "avg_rating" numeric(3,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "review_count" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "rating" smallint NOT NULL,
        "title" varchar(120),
        "comment" varchar(2000),
        "is_verified_purchase" boolean NOT NULL DEFAULT true,
        "status" varchar(16) NOT NULL DEFAULT 'visible',
        "moderated_by_user_id" uuid,
        "moderated_at" TIMESTAMP,
        "moderation_reason" varchar(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_product_reviews_rating" CHECK ("rating" BETWEEN 1 AND 5),
        CONSTRAINT "FK_product_reviews_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_reviews_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_product_reviews_product_user"
        ON "product_reviews" ("product_id", "user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_reviews_product_created"
        ON "product_reviews" ("product_id", "created_at" DESC)
    `);
    this.logger.log('Created product_reviews table + product rating columns');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_reviews"`);
    await queryRunner.query(`
      ALTER TABLE "products"
        DROP COLUMN IF EXISTS "review_count",
        DROP COLUMN IF EXISTS "avg_rating"
    `);
  }
}
