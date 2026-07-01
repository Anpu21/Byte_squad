import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Customer hub — the `customer_profiles` side-table (Phase 0).
 *
 * Holds only management metadata (tags, notes, segment, status, display-name
 * override, merge alias) for a phone-stitched customer, keyed by `customer_key`
 * (`94…` normalized phone or `u:<userId>`). NOT a canonical customer master —
 * no FKs to users/loyalty/credit. Index name matches the `@Index` on the
 * CustomerProfile entity so dev (DB_SYNC) and prod (this migration) converge.
 * Idempotent.
 */
export class CreateCustomerProfiles1779733500000 implements MigrationInterface {
  name = 'CreateCustomerProfiles1779733500000';
  private readonly logger = new Logger(CreateCustomerProfiles1779733500000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "customer_key" varchar(64) NOT NULL,
        "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "notes" text,
        "segment" varchar(64),
        "status" varchar(16) NOT NULL DEFAULT 'active',
        "display_name" varchar(120),
        "linked_user_id" uuid,
        "created_by_user_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_profiles" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_customer_profiles_customer_key" ON "customer_profiles" ("customer_key")`,
    );
    this.logger.log('Created customer_profiles table + unique customer_key index');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_customer_profiles_customer_key"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_profiles"`);
  }
}
