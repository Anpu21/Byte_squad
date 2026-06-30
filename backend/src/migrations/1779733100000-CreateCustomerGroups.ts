import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Customer Groups — shared "shop together" groups for storefront customers.
 *
 * Adds three tables — `customer_groups` (the group + its shareable join code),
 * `customer_group_members` (who belongs, owner vs member) and `group_cart_items`
 * (the group's single shared cart) — plus a nullable
 * `customer_orders.customer_group_id` so a group's purchases roll up into its
 * analytics. The customer_orders FK is scalar-only at the entity level (no
 * relation) to avoid a module import cycle, and is DISTINCT from the existing
 * `group_code`, which only batches one multi-branch checkout for a single
 * PayHere payment.
 *
 * Idempotent (every step guarded) so it is safe whether or not a `DB_SYNC` boot
 * already created the objects, and safe to re-run. Dev = `DB_SYNC`; prod runs this.
 */
export class CreateCustomerGroups1779733100000 implements MigrationInterface {
  name = 'CreateCustomerGroups1779733100000';
  private readonly logger = new Logger(CreateCustomerGroups1779733100000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- customer_groups -----------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_groups" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "join_code" varchar(24) NOT NULL,
        "owner_user_id" uuid NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_groups" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_customer_groups_join_code"
        ON "customer_groups" ("join_code")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_groups_owner_user_id"
        ON "customer_groups" ("owner_user_id")
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_customer_groups_owner'
        ) THEN
          ALTER TABLE "customer_groups"
            ADD CONSTRAINT "FK_customer_groups_owner"
            FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
            ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    // --- customer_group_members ---------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_group_members" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "customer_group_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" varchar(16) NOT NULL DEFAULT 'member',
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_group_members" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_customer_group_members_group_user"
        ON "customer_group_members" ("customer_group_id", "user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_group_members_user_id"
        ON "customer_group_members" ("user_id")
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_customer_group_members_group'
        ) THEN
          ALTER TABLE "customer_group_members"
            ADD CONSTRAINT "FK_customer_group_members_group"
            FOREIGN KEY ("customer_group_id") REFERENCES "customer_groups"("id")
            ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_customer_group_members_user'
        ) THEN
          ALTER TABLE "customer_group_members"
            ADD CONSTRAINT "FK_customer_group_members_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // --- group_cart_items ----------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "group_cart_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "customer_group_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "unit_id" uuid,
        "quantity" decimal(12,3) NOT NULL,
        "amount" decimal(12,2),
        "added_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_group_cart_items" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_group_cart_items_customer_group_id"
        ON "group_cart_items" ("customer_group_id")
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_group_cart_items_group'
        ) THEN
          ALTER TABLE "group_cart_items"
            ADD CONSTRAINT "FK_group_cart_items_group"
            FOREIGN KEY ("customer_group_id") REFERENCES "customer_groups"("id")
            ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_group_cart_items_product'
        ) THEN
          ALTER TABLE "group_cart_items"
            ADD CONSTRAINT "FK_group_cart_items_product"
            FOREIGN KEY ("product_id") REFERENCES "products"("id")
            ON DELETE RESTRICT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_group_cart_items_branch'
        ) THEN
          ALTER TABLE "group_cart_items"
            ADD CONSTRAINT "FK_group_cart_items_branch"
            FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
            ON DELETE RESTRICT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_group_cart_items_added_by'
        ) THEN
          ALTER TABLE "group_cart_items"
            ADD CONSTRAINT "FK_group_cart_items_added_by"
            FOREIGN KEY ("added_by_user_id") REFERENCES "users"("id")
            ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // --- customer_orders.customer_group_id ----------------------------------
    await queryRunner.query(`
      ALTER TABLE "customer_orders"
        ADD COLUMN IF NOT EXISTS "customer_group_id" uuid
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_customer_orders_customer_group'
        ) THEN
          ALTER TABLE "customer_orders"
            ADD CONSTRAINT "FK_customer_orders_customer_group"
            FOREIGN KEY ("customer_group_id") REFERENCES "customer_groups"("id")
            ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_orders_customer_group_id"
        ON "customer_orders" ("customer_group_id")
    `);

    this.logger.log(
      'customer_groups + customer_group_members + group_cart_items created; customer_orders.customer_group_id added',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer_orders" DROP CONSTRAINT IF EXISTS "FK_customer_orders_customer_group"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_customer_orders_customer_group_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "customer_group_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "group_cart_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_group_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_groups"`);
  }
}
