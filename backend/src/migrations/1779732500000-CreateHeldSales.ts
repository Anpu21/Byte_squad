import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Server-persisted held / suspended sales. A parked cart is stored as an
 * opaque jsonb snapshot (no inventory/ledger FKs — a held cart must not
 * touch stock) so it can be recalled on any terminal in the branch.
 */
export class CreateHeldSales1779732500000 implements MigrationInterface {
  name = 'CreateHeldSales1779732500000';
  private readonly logger = new Logger(CreateHeldSales1779732500000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "held_sales" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "branch_id" uuid NOT NULL,
        "cashier_id" uuid NOT NULL,
        "label" varchar(120) NOT NULL,
        "item_count" integer NOT NULL,
        "total" numeric(12,2) NOT NULL,
        "snapshot" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_held_sales" PRIMARY KEY ("id"),
        CONSTRAINT "FK_held_sales_branch" FOREIGN KEY ("branch_id")
          REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_held_sales_cashier" FOREIGN KEY ("cashier_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_held_sales_branch"
        ON "held_sales" ("branch_id")
    `);
    this.logger.log('Created held_sales table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "held_sales"`);
  }
}
