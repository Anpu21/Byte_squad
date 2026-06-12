import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 4 — automatic POS discount schemes. A rule targets a product or
 * a category (one of product_id/category set, the other NULL), runs for
 * an inclusive date window, and optionally gates on a quantity slab.
 * branch_id NULL means the rule applies to every branch.
 */
export class CreateDiscountSchemes1779731700000 implements MigrationInterface {
  name = 'CreateDiscountSchemes1779731700000';
  private readonly logger = new Logger(CreateDiscountSchemes1779731700000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "discount_schemes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "branch_id" uuid,
        "scope" varchar(16) NOT NULL,
        "product_id" uuid,
        "category" varchar(120),
        "min_qty" numeric(12,3) NOT NULL DEFAULT 0,
        "discount_percentage" numeric(5,2) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_discount_schemes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_discount_schemes_branch" FOREIGN KEY ("branch_id")
          REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_discount_schemes_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_discount_schemes_created_by" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_discount_schemes_is_active"
        ON "discount_schemes" ("is_active")
    `);
    this.logger.log('Created discount_schemes table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "discount_schemes"`);
  }
}
