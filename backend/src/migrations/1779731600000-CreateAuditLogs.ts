import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 4 — append-only activity log. One row per mutating API call,
 * written by the global audit interceptor. No request bodies by design.
 */
export class CreateAuditLogs1779731600000 implements MigrationInterface {
  name = 'CreateAuditLogs1779731600000';
  private readonly logger = new Logger(CreateAuditLogs1779731600000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "user_role" varchar(32),
        "method" varchar(8) NOT NULL,
        "path" varchar(255) NOT NULL,
        "status_code" integer NOT NULL,
        "duration_ms" integer NOT NULL,
        "branch_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_created" ON "audit_logs" ("created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_user" ON "audit_logs" ("user_id")
    `);
    this.logger.log('Created audit_logs table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
