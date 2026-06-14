import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Purchases Phase 1 — supplier master.
 *
 * New table `suppliers`: the "party" registry behind the procurement cycle.
 * Global (not branch-scoped) — purchase documents carry the branch. `user_id`
 * stays nullable and unused (portal-ready, staff-only flow for now).
 */
export class CreateSuppliers1779730600000 implements MigrationInterface {
  name = 'CreateSuppliers1779730600000';
  private readonly logger = new Logger(CreateSuppliers1779730600000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "suppliers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(160) NOT NULL,
        "contact_name" varchar(120),
        "phone" varchar(32),
        "email" varchar(160),
        "address" varchar(255),
        "credit_term_days" integer NOT NULL DEFAULT 30,
        "opening_balance" numeric(12,2) NOT NULL DEFAULT 0,
        "status" varchar(16) NOT NULL DEFAULT 'Active',
        "user_id" uuid,
        "notes" text,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suppliers" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_suppliers_name_lower"
        ON "suppliers" (LOWER("name"))
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_suppliers_status" ON "suppliers" ("status")
    `);
    this.logger.log('Created suppliers table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "suppliers"`);
  }
}
