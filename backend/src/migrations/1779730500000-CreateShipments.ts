import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 1 — courier-driven delivery tracking for stock transfers.
 *
 * New table `shipments`: a parcel grouping approved transfer lines from one
 * source branch to one destination branch, with a full delivery lifecycle
 * (pending → ready_to_ship → dispatched → out_for_delivery → delivered, plus
 * cancelled / returned). New table `shipment_events`: the append-only
 * tracking timeline. `stock_transfer_requests` gains a nullable `shipment_id`
 * linking a line to its shipment.
 *
 * Additive: existing transfers keep using the per-line ship/receive flow and
 * are left unlinked (shipment_id NULL); no backfill.
 */
export class CreateShipments1779730500000 implements MigrationInterface {
  name = 'CreateShipments1779730500000';
  private readonly logger = new Logger(CreateShipments1779730500000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "shipments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tracking_ref" varchar(32) NOT NULL,
        "batch_id" uuid,
        "source_branch_id" uuid NOT NULL,
        "destination_branch_id" uuid NOT NULL,
        "status" varchar(24) NOT NULL DEFAULT 'pending',
        "courier_employee_id" uuid,
        "eta" TIMESTAMP,
        "created_by_user_id" uuid NOT NULL,
        "dispatched_by_user_id" uuid,
        "dispatched_at" TIMESTAMP,
        "delivered_by_user_id" uuid,
        "delivered_at" TIMESTAMP,
        "returned_by_user_id" uuid,
        "returned_at" TIMESTAMP,
        "cancelled_by_user_id" uuid,
        "cancelled_at" TIMESTAMP,
        "exception_reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shipments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_shipments_tracking_ref" UNIQUE ("tracking_ref"),
        CONSTRAINT "FK_shipments_source_branch" FOREIGN KEY ("source_branch_id")
          REFERENCES "branches"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_shipments_dest_branch" FOREIGN KEY ("destination_branch_id")
          REFERENCES "branches"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_shipments_courier" FOREIGN KEY ("courier_employee_id")
          REFERENCES "employees"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_shipments_created_by" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_shipments_status_created"
        ON "shipments" ("status", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_shipments_dest_status"
        ON "shipments" ("destination_branch_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_shipments_source_status"
        ON "shipments" ("source_branch_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_shipments_courier_status"
        ON "shipments" ("courier_employee_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_shipments_batch" ON "shipments" ("batch_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "shipment_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "shipment_id" uuid NOT NULL,
        "type" varchar(24) NOT NULL,
        "location" varchar(160),
        "note" text,
        "actor_user_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shipment_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_shipment_events_shipment" FOREIGN KEY ("shipment_id")
          REFERENCES "shipments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_shipment_events_actor" FOREIGN KEY ("actor_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_shipment_events_shipment_created"
        ON "shipment_events" ("shipment_id", "created_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "stock_transfer_requests" ADD COLUMN "shipment_id" uuid
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_stock_transfer_requests_shipment"
        ON "stock_transfer_requests" ("shipment_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "stock_transfer_requests"
        ADD CONSTRAINT "FK_stock_transfer_requests_shipment"
        FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id")
        ON DELETE SET NULL
    `);

    this.logger.log('Created shipments + shipment_events; linked transfers');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stock_transfer_requests"
        DROP CONSTRAINT IF EXISTS "FK_stock_transfer_requests_shipment"
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_stock_transfer_requests_shipment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_transfer_requests" DROP COLUMN IF EXISTS "shipment_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "shipment_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shipments"`);
  }
}
