import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase BE-Auth — refresh-token persistence for the RS256 migration.
 *
 * Opaque, rotating refresh tokens (the access token is a short-lived RS256
 * JWT). Only the SHA-256 hash is stored; `family` links a rotation lineage so a
 * detected reuse can revoke the whole chain. Mirrors the `RefreshToken` entity;
 * applied in production where `synchronize` is off.
 */
export class CreateRefreshTokens1779730000000 implements MigrationInterface {
  name = 'CreateRefreshTokens1779730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(64) NOT NULL,
        "family" uuid NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "revoked_at" TIMESTAMP,
        "replaced_by_token_hash" varchar(64),
        "user_agent" varchar(255),
        "ip" varchar(45),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_token_hash" UNIQUE ("token_hash")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_family" ON "refresh_tokens" ("family")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
