import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase BE-H1 — introduces the HR module's persistence layer mirrored
 * on the Shanel ERP HR schema (docs/sample-project/Shanel_ERP/backend/
 * models/hr) but adapted to LedgerPro's NestJS + TypeORM + UUID +
 * branch-scoped conventions.
 *
 * New tables:
 *   * employees — full HR profile (NIC, hire date, role, EPF/ETF
 *     eligibility, bank info, annual leave balance). `user_id` is
 *     optional + partially unique so cashier/manager staff who also
 *     log in to the POS are linked, while non-login staff sit on the
 *     same table.
 *   * salary_structures — per-employee, time-bounded compensation.
 *   * attendance — daily check-in/check-out, lateness, OT flags.
 *   * attendance_summaries — monthly rollup, fed into payroll runs.
 *   * employee_leaves — leave requests + approval workflow.
 *   * payroll_settings — SL statutory EPF/ETF percentages, attendance
 *     bonus threshold, late grace minutes; per branch + a single
 *     global default row (seeded by this migration).
 *   * payrolls — monthly payroll run with gross / deductions / net +
 *     payment status + bank reference.
 *
 * Mirrors `backend/migrations/2026-05-26-create-hr-module.sql`. The TS
 * path and the raw SQL path produce the same schema and seed.
 *
 * down() drops the new tables in reverse FK order — acceptable because
 * this is a fresh module with no production data to preserve.
 */
export class CreateHrModule1779635900000 implements MigrationInterface {
  name = 'CreateHrModule1779635900000';
  private readonly logger = new Logger(CreateHrModule1779635900000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. employees — base HR profile.
    await queryRunner.query(`
      CREATE TABLE "employees" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "employee_code" varchar(50) NOT NULL,
        "user_id" uuid,
        "branch_id" uuid NOT NULL,
        "full_name" varchar(200) NOT NULL,
        "name_with_initials" varchar(200),
        "nic" varchar(20),
        "date_of_birth" date,
        "gender" varchar(10),
        "marital_status" varchar(20),
        "contact_phone" varchar(16) NOT NULL,
        "contact_phone_2" varchar(16),
        "email" varchar(100),
        "permanent_address" text,
        "current_address" text,
        "city" varchar(100),
        "emergency_contact_name" varchar(200),
        "emergency_contact_phone" varchar(16),
        "emergency_contact_relationship" varchar(50),
        "hire_date" date NOT NULL,
        "confirmation_date" date,
        "employee_type" varchar(20) NOT NULL DEFAULT 'Permanent',
        "role" varchar(100) NOT NULL,
        "working_hours_start" time NOT NULL DEFAULT '08:00:00',
        "working_hours_end" time NOT NULL DEFAULT '16:00:00',
        "epf_eligible" boolean NOT NULL DEFAULT false,
        "etf_eligible" boolean NOT NULL DEFAULT false,
        "epf_number" varchar(50),
        "etf_number" varchar(50),
        "bank_name" varchar(100),
        "bank_account_no" varchar(50),
        "bank_branch" varchar(100),
        "bank_account_name" varchar(200),
        "status" varchar(50) NOT NULL DEFAULT 'Active',
        "resignation_date" date,
        "resignation_reason" text,
        "termination_date" date,
        "termination_reason" text,
        "notes" text,
        "photo_url" varchar(255),
        "annual_leave_balance" decimal(4,1) NOT NULL DEFAULT 14,
        "created_by" uuid,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "pk_employees" PRIMARY KEY ("id"),
        CONSTRAINT "ck_employees_gender"
          CHECK ("gender" IS NULL OR "gender" IN ('Male', 'Female', 'Other')),
        CONSTRAINT "ck_employees_marital_status"
          CHECK ("marital_status" IS NULL OR "marital_status" IN ('Single', 'Married', 'Divorced', 'Widowed')),
        CONSTRAINT "ck_employees_employee_type"
          CHECK ("employee_type" IN ('Permanent', 'Contract', 'Casual', 'Intern'))
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_employees_employee_code" ON "employees" ("employee_code")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_employees_user_id_not_null" ON "employees" ("user_id") WHERE "user_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_employees_nic_not_null" ON "employees" ("nic") WHERE "nic" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_employees_branch_id" ON "employees" ("branch_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "employees"
        ADD CONSTRAINT "fk_employees_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        ADD CONSTRAINT "fk_employees_branch"
          FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "fk_employees_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // 2. salary_structures — time-bounded compensation.
    await queryRunner.query(`
      CREATE TABLE "salary_structures" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "employee_id" uuid NOT NULL,
        "salary_type" varchar(20) NOT NULL,
        "monthly_base" decimal(10,2) NOT NULL DEFAULT 0,
        "daily_rate" decimal(10,2) NOT NULL DEFAULT 0,
        "production_rate_per_card" decimal(10,2) NOT NULL DEFAULT 0,
        "tea_allowance_daily" decimal(10,2) NOT NULL DEFAULT 60,
        "ot_rate_per_hour" decimal(10,2) NOT NULL DEFAULT 400,
        "attendance_bonus_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "effective_from_date" date NOT NULL,
        "effective_to_date" date,
        "status" varchar(20) NOT NULL DEFAULT 'Active',
        "notes" text,
        "created_by" uuid,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "pk_salary_structures" PRIMARY KEY ("id"),
        CONSTRAINT "ck_salary_structures_salary_type"
          CHECK ("salary_type" IN ('Monthly_Fixed', 'Production_Based')),
        CONSTRAINT "ck_salary_structures_status"
          CHECK ("status" IN ('Active', 'Inactive'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_salary_structures_employee_effective" ON "salary_structures" ("employee_id", "effective_from_date")`,
    );

    await queryRunner.query(`
      ALTER TABLE "salary_structures"
        ADD CONSTRAINT "fk_salary_structures_employee"
          FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
    `);

    // 3. attendance — daily.
    await queryRunner.query(`
      CREATE TABLE "attendance" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "employee_id" uuid NOT NULL,
        "attendance_date" date NOT NULL,
        "check_in_time" time,
        "check_out_time" time,
        "total_hours" decimal(4,2),
        "status" varchar(20) NOT NULL,
        "is_late" boolean NOT NULL DEFAULT false,
        "late_minutes" int NOT NULL DEFAULT 0,
        "is_overtime" boolean NOT NULL DEFAULT false,
        "overtime_hours" decimal(4,2) NOT NULL DEFAULT 0,
        "marked_by" varchar(20) NOT NULL DEFAULT 'Manual',
        "cards_produced" int NOT NULL DEFAULT 0,
        "notes" text,
        "created_by" uuid,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "pk_attendance" PRIMARY KEY ("id"),
        CONSTRAINT "uq_attendance_employee_date" UNIQUE ("employee_id", "attendance_date"),
        CONSTRAINT "ck_attendance_status"
          CHECK ("status" IN ('Present', 'Absent', 'Half_Day', 'Leave', 'Holiday', 'Weekend')),
        CONSTRAINT "ck_attendance_marked_by"
          CHECK ("marked_by" IN ('Cashier_Self', 'Manual', 'Admin', 'System'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_attendance_date" ON "attendance" ("attendance_date")`,
    );

    await queryRunner.query(`
      ALTER TABLE "attendance"
        ADD CONSTRAINT "fk_attendance_employee"
          FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
    `);

    // 4. attendance_summaries — monthly rollup.
    await queryRunner.query(`
      CREATE TABLE "attendance_summaries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "employee_id" uuid NOT NULL,
        "month" int NOT NULL,
        "year" int NOT NULL,
        "total_working_days" int NOT NULL,
        "present_days" int NOT NULL DEFAULT 0,
        "absent_days" int NOT NULL DEFAULT 0,
        "leave_days" int NOT NULL DEFAULT 0,
        "half_days" int NOT NULL DEFAULT 0,
        "late_days" int NOT NULL DEFAULT 0,
        "total_overtime_hours" decimal(6,2) NOT NULL DEFAULT 0,
        "attendance_bonus_eligible" boolean NOT NULL DEFAULT false,
        "attendance_bonus_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "summary_date" date NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "pk_attendance_summaries" PRIMARY KEY ("id"),
        CONSTRAINT "uq_attendance_summaries_employee_month_year" UNIQUE ("employee_id", "month", "year")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "attendance_summaries"
        ADD CONSTRAINT "fk_attendance_summaries_employee"
          FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
    `);

    // 5. employee_leaves — request + approval workflow.
    await queryRunner.query(`
      CREATE TABLE "employee_leaves" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "employee_id" uuid NOT NULL,
        "leave_type" varchar(20) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "total_days" decimal(4,1) NOT NULL,
        "reason" text,
        "status" varchar(20) NOT NULL DEFAULT 'Pending',
        "applied_date" date NOT NULL,
        "approved_by" uuid,
        "approved_date" date,
        "rejection_reason" text,
        "notes" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "pk_employee_leaves" PRIMARY KEY ("id"),
        CONSTRAINT "ck_employee_leaves_type"
          CHECK ("leave_type" IN ('Annual', 'Sick', 'Casual', 'No_Pay', 'Maternity', 'Paternity')),
        CONSTRAINT "ck_employee_leaves_status"
          CHECK ("status" IN ('Pending', 'Approved', 'Rejected', 'Cancelled'))
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_leaves"
        ADD CONSTRAINT "fk_employee_leaves_employee"
          FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "fk_employee_leaves_approved_by"
          FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // 6. payroll_settings — per-branch + one global default row.
    await queryRunner.query(`
      CREATE TABLE "payroll_settings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "branch_id" uuid,
        "epf_employee_percent" decimal(5,2) NOT NULL DEFAULT 8.00,
        "epf_employer_percent" decimal(5,2) NOT NULL DEFAULT 12.00,
        "etf_employer_percent" decimal(5,2) NOT NULL DEFAULT 3.00,
        "attendance_bonus_threshold" int NOT NULL DEFAULT 26,
        "late_grace_minutes" int NOT NULL DEFAULT 15,
        "created_by" uuid,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "pk_payroll_settings" PRIMARY KEY ("id")
      )
    `);

    // One row per branch (where branch is set).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_payroll_settings_branch_not_null" ON "payroll_settings" ("branch_id") WHERE "branch_id" IS NOT NULL`,
    );
    // At most one global default row (branch IS NULL).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_payroll_settings_global" ON "payroll_settings" ((branch_id IS NULL)) WHERE "branch_id" IS NULL`,
    );

    await queryRunner.query(`
      ALTER TABLE "payroll_settings"
        ADD CONSTRAINT "fk_payroll_settings_branch"
          FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "fk_payroll_settings_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // 7. payrolls — monthly run.
    await queryRunner.query(`
      CREATE TABLE "payrolls" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "employee_id" uuid NOT NULL,
        "pay_period_month" int NOT NULL,
        "pay_period_year" int NOT NULL,
        "basic_salary" decimal(10,2) NOT NULL DEFAULT 0,
        "production_earnings" decimal(10,2) NOT NULL DEFAULT 0,
        "overtime_earnings" decimal(10,2) NOT NULL DEFAULT 0,
        "attendance_bonus" decimal(10,2) NOT NULL DEFAULT 0,
        "tea_allowance" decimal(10,2) NOT NULL DEFAULT 0,
        "other_allowances" decimal(10,2) NOT NULL DEFAULT 0,
        "gross_salary" decimal(10,2) NOT NULL,
        "epf_employee_deduction" decimal(10,2) NOT NULL DEFAULT 0,
        "etf_employee_deduction" decimal(10,2) NOT NULL DEFAULT 0,
        "advance_deduction" decimal(10,2) NOT NULL DEFAULT 0,
        "other_deductions" decimal(10,2) NOT NULL DEFAULT 0,
        "total_deductions" decimal(10,2) NOT NULL,
        "net_salary" decimal(10,2) NOT NULL,
        "epf_employer_contribution" decimal(10,2) NOT NULL DEFAULT 0,
        "etf_employer_contribution" decimal(10,2) NOT NULL DEFAULT 0,
        "payment_status" varchar(20) NOT NULL DEFAULT 'Pending',
        "payment_date" date,
        "payment_method" varchar(20) NOT NULL DEFAULT 'Bank_Transfer',
        "bank_reference_no" varchar(100),
        "pay_slip_generated" boolean NOT NULL DEFAULT false,
        "pay_slip_url" varchar(255),
        "notes" text,
        "other_deductions_reason" text,
        "other_allowances_reason" text,
        "generated_by" uuid,
        "approved_by" uuid,
        "generated_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "pk_payrolls" PRIMARY KEY ("id"),
        CONSTRAINT "uq_payrolls_employee_period" UNIQUE ("employee_id", "pay_period_month", "pay_period_year"),
        CONSTRAINT "ck_payrolls_payment_status"
          CHECK ("payment_status" IN ('Pending', 'Approved', 'Paid', 'Cancelled')),
        CONSTRAINT "ck_payrolls_payment_method"
          CHECK ("payment_method" IN ('Cash', 'Bank_Transfer', 'Cheque'))
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "payrolls"
        ADD CONSTRAINT "fk_payrolls_employee"
          FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT,
        ADD CONSTRAINT "fk_payrolls_generated_by"
          FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE SET NULL,
        ADD CONSTRAINT "fk_payrolls_approved_by"
          FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // 8. Seed the global default payroll_settings row (Sri Lankan
    //    statutory rates). Guarded with WHERE NOT EXISTS so re-running
    //    the migration after a hand-applied SQL companion does not
    //    explode on the partial unique.
    await queryRunner.query(`
      INSERT INTO "payroll_settings" (
        "branch_id",
        "epf_employee_percent",
        "epf_employer_percent",
        "etf_employer_percent",
        "attendance_bonus_threshold",
        "late_grace_minutes"
      )
      SELECT NULL, 8.00, 12.00, 3.00, 26, 15
      WHERE NOT EXISTS (
        SELECT 1 FROM "payroll_settings" WHERE "branch_id" IS NULL
      )
    `);

    this.logger.log('CreateHrModule migration applied');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse FK order. No data-loss guard — fresh module.
    await queryRunner.query(`DROP TABLE IF EXISTS "payrolls"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payroll_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_leaves"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_summaries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "salary_structures"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employees"`);
    this.logger.log('CreateHrModule migration reverted');
  }
}
