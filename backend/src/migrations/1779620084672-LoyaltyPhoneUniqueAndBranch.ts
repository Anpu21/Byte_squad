import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase BE-L1 of the loyalty re-architecture: opens loyalty to walk-in
 * customers (phone-as-identity) alongside the existing user-keyed
 * online customers, and stamps the originating branch on every
 * ledger row so the admin "active at branch X since <date>" filter
 * stays cheap.
 *
 * Schema changes:
 *   * `loyalty_customers` (phone UNIQUE) — walk-in identity table.
 *   * `loyalty_accounts.user_id` becomes nullable; adds
 *     `loyalty_customer_id` + CHECK (exactly one owner) + two
 *     partial unique indexes (one slot per owner type).
 *   * `loyalty_ledger_entries`: same polymorphic split + nullable
 *     `branch_id` FK to `branches` + composite index on
 *     `(branch_id, created_at DESC)` for the admin filter.
 *   * `users.phone`: partial unique where phone IS NOT NULL, so a
 *     future online sign-up matching a walk-in phone can be merged
 *     deterministically.
 *
 * Safety: aborts up() if duplicate non-null phones already exist on
 * `users`, reporting up to three sample dupes so the operator knows
 * where to start cleaning. down() is a logged no-op — see comment
 * inside.
 *
 * Mirrors `backend/migrations/2026-05-25-loyalty-phone-unique-and-branch.sql`.
 */
export class LoyaltyPhoneUniqueAndBranch1779620084672 implements MigrationInterface {
  name = 'LoyaltyPhoneUniqueAndBranch1779620084672';
  private readonly logger = new Logger(
    LoyaltyPhoneUniqueAndBranch1779620084672.name,
  );

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Safety: refuse to enforce unique(phone) on users until existing
    //    duplicates are cleaned up. Better to abort than to silently
    //    lose data when the partial unique index is created.
    const dupes = (await queryRunner.query(
      `SELECT phone, COUNT(*)::text AS count
       FROM users
       WHERE phone IS NOT NULL
       GROUP BY phone
       HAVING COUNT(*) > 1`,
    )) as { phone: string; count: string }[];
    if (dupes.length > 0) {
      const sample = dupes
        .slice(0, 3)
        .map((d) => `${d.phone} (x${d.count})`)
        .join(', ');
      throw new Error(
        `Cannot enforce unique(phone) on users — ${dupes.length} duplicate non-null phone(s) found. ` +
          `Run a dedupe script first. Example dupes: ${sample}`,
      );
    }

    // 2. loyalty_customers — walk-in identity table.
    await queryRunner.query(`
      CREATE TABLE "loyalty_customers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "phone" varchar(16) NOT NULL,
        "first_name" varchar(60) NOT NULL,
        "last_name" varchar(60),
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "pk_loyalty_customers" PRIMARY KEY ("id"),
        CONSTRAINT "uq_loyalty_customers_phone" UNIQUE ("phone")
      )
    `);

    // 3. Partial unique index on users.phone (phone IS NOT NULL).
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_users_phone_not_null"
      ON "users" ("phone")
      WHERE "phone" IS NOT NULL
    `);

    // 4. loyalty_accounts: relax user_id, add loyalty_customer_id,
    //    swap the strict unique index for two partial uniques + CHECK.
    //
    //    The original SQL migration created the table with an inline
    //    `user_id uuid NOT NULL UNIQUE …`, which Postgres named
    //    `loyalty_accounts_user_id_key`. The TypeORM entity also had
    //    `@Index(['userId'], { unique: true })` which generates a name
    //    like `IDX_<hash>` if synced. Both are dropped defensively.
    await queryRunner.query(
      `ALTER TABLE "loyalty_accounts" DROP CONSTRAINT IF EXISTS "loyalty_accounts_user_id_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_accounts" DROP CONSTRAINT IF EXISTS "UQ_loyalty_accounts_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_loyalty_accounts_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_accounts" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_accounts" ADD COLUMN "loyalty_customer_id" uuid`,
    );
    await queryRunner.query(`
      ALTER TABLE "loyalty_accounts"
      ADD CONSTRAINT "fk_loyalty_accounts_loyalty_customer"
      FOREIGN KEY ("loyalty_customer_id") REFERENCES "loyalty_customers"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_loyalty_accounts_user_id_not_null"
      ON "loyalty_accounts" ("user_id")
      WHERE "user_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_loyalty_accounts_loyalty_customer_id_not_null"
      ON "loyalty_accounts" ("loyalty_customer_id")
      WHERE "loyalty_customer_id" IS NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "loyalty_accounts"
      ADD CONSTRAINT "ck_loyalty_accounts_owner_exactly_one"
      CHECK (
        (user_id IS NOT NULL AND loyalty_customer_id IS NULL)
        OR (user_id IS NULL AND loyalty_customer_id IS NOT NULL)
      )
    `);

    // 5. loyalty_ledger_entries: nullable user_id, add
    //    loyalty_customer_id + branch_id, swap the (would-be) strict
    //    unique-3 for two partial uniques, and add the branch+time
    //    composite index for the admin filter.
    await queryRunner.query(
      `ALTER TABLE "loyalty_ledger_entries" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_ledger_entries" ADD COLUMN "loyalty_customer_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_ledger_entries" ADD COLUMN "branch_id" uuid`,
    );
    await queryRunner.query(`
      ALTER TABLE "loyalty_ledger_entries"
      ADD CONSTRAINT "fk_loyalty_ledger_loyalty_customer"
      FOREIGN KEY ("loyalty_customer_id") REFERENCES "loyalty_customers"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "loyalty_ledger_entries"
      ADD CONSTRAINT "fk_loyalty_ledger_branch"
      FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "loyalty_ledger_entries" DROP CONSTRAINT IF EXISTS "UQ_loyalty_ledger_user_order_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_loyalty_ledger_user_order_type"`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_loyalty_ledger_user_order_type_not_null"
      ON "loyalty_ledger_entries" ("user_id", "order_id", "type")
      WHERE "user_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_loyalty_ledger_customer_order_type_not_null"
      ON "loyalty_ledger_entries" ("loyalty_customer_id", "order_id", "type")
      WHERE "loyalty_customer_id" IS NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "loyalty_ledger_entries"
      ADD CONSTRAINT "ck_loyalty_ledger_owner_exactly_one"
      CHECK (
        (user_id IS NOT NULL AND loyalty_customer_id IS NULL)
        OR (user_id IS NULL AND loyalty_customer_id IS NOT NULL)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_loyalty_ledger_branch_created_at"
      ON "loyalty_ledger_entries" ("branch_id", "created_at" DESC)
    `);

    this.logger.log('LoyaltyPhoneUniqueAndBranch migration applied');
  }

  public down(_queryRunner: QueryRunner): Promise<void> {
    // Polymorphic CHECK + dual partial indexes make down() risky:
    //   * walk-in rows (loyalty_customer_id IS NOT NULL) would be
    //     orphaned the moment the CHECK is relaxed back to a strict
    //     user_id NOT NULL — DELETE-first is implicit but
    //     destructive on real data.
    //   * Reinstating users.phone strict uniqueness can also fail
    //     after merge flows have run.
    // Refuse to auto-reverse and require a hand-written rollback.
    void _queryRunner;
    this.logger.warn(
      'LoyaltyPhoneUniqueAndBranch.down() intentionally left a no-op; ' +
        'polymorphic ownership + branch FK reversal is too risky to auto-revert. ' +
        'Roll back by writing a targeted SQL script that first re-points / deletes ' +
        'walk-in rows, then drops the new constraints/columns/tables.',
    );
    return Promise.resolve();
  }
}
