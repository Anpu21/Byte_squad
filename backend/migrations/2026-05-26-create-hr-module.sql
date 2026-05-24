-- LedgerPro — Phase BE-H1 of the HR (attendance + payroll) module.
--
-- Introduces the HR persistence layer mirrored on the Shanel ERP HR
-- schema (docs/sample-project/Shanel_ERP/backend/models/hr) but
-- adapted to LedgerPro's NestJS + TypeORM + UUID + branch-scoped
-- conventions.
--
-- This script mirrors the TypeORM migration
-- `1779635900000-CreateHrModule.ts`. Either path produces the same
-- schema and seeded global payroll_settings row.
--
-- WHEN TO RUN: After all prior 2026-05 migrations. The TypeORM
-- migration runner already handles "applied / not applied" via the
-- migrations table — this script is the manual companion for
-- environments that apply raw SQL directly.

BEGIN;

-- 1. employees — base HR profile.
CREATE TABLE employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code varchar(50) NOT NULL,
    user_id uuid,
    branch_id uuid NOT NULL,
    full_name varchar(200) NOT NULL,
    name_with_initials varchar(200),
    nic varchar(20),
    date_of_birth date,
    gender varchar(10),
    marital_status varchar(20),
    contact_phone varchar(16) NOT NULL,
    contact_phone_2 varchar(16),
    email varchar(100),
    permanent_address text,
    current_address text,
    city varchar(100),
    emergency_contact_name varchar(200),
    emergency_contact_phone varchar(16),
    emergency_contact_relationship varchar(50),
    hire_date date NOT NULL,
    confirmation_date date,
    employee_type varchar(20) NOT NULL DEFAULT 'Permanent',
    role varchar(100) NOT NULL,
    working_hours_start time NOT NULL DEFAULT '08:00:00',
    working_hours_end time NOT NULL DEFAULT '16:00:00',
    epf_eligible boolean NOT NULL DEFAULT false,
    etf_eligible boolean NOT NULL DEFAULT false,
    epf_number varchar(50),
    etf_number varchar(50),
    bank_name varchar(100),
    bank_account_no varchar(50),
    bank_branch varchar(100),
    bank_account_name varchar(200),
    status varchar(50) NOT NULL DEFAULT 'Active',
    resignation_date date,
    resignation_reason text,
    termination_date date,
    termination_reason text,
    notes text,
    photo_url varchar(255),
    annual_leave_balance decimal(4,1) NOT NULL DEFAULT 14,
    created_by uuid,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT ck_employees_gender
        CHECK (gender IS NULL OR gender IN ('Male', 'Female', 'Other')),
    CONSTRAINT ck_employees_marital_status
        CHECK (marital_status IS NULL OR marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
    CONSTRAINT ck_employees_employee_type
        CHECK (employee_type IN ('Permanent', 'Contract', 'Casual', 'Intern'))
);

CREATE UNIQUE INDEX uq_employees_employee_code ON employees (employee_code);
CREATE UNIQUE INDEX uq_employees_user_id_not_null
    ON employees (user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_employees_nic_not_null
    ON employees (nic) WHERE nic IS NOT NULL;
CREATE INDEX idx_employees_branch_id ON employees (branch_id);

ALTER TABLE employees
    ADD CONSTRAINT fk_employees_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_employees_branch
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_employees_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 2. salary_structures — time-bounded compensation.
CREATE TABLE salary_structures (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL,
    salary_type varchar(20) NOT NULL,
    monthly_base decimal(10,2) NOT NULL DEFAULT 0,
    daily_rate decimal(10,2) NOT NULL DEFAULT 0,
    production_rate_per_card decimal(10,2) NOT NULL DEFAULT 0,
    tea_allowance_daily decimal(10,2) NOT NULL DEFAULT 60,
    ot_rate_per_hour decimal(10,2) NOT NULL DEFAULT 400,
    attendance_bonus_amount decimal(10,2) NOT NULL DEFAULT 0,
    effective_from_date date NOT NULL,
    effective_to_date date,
    status varchar(20) NOT NULL DEFAULT 'Active',
    notes text,
    created_by uuid,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT ck_salary_structures_salary_type
        CHECK (salary_type IN ('Monthly_Fixed', 'Production_Based')),
    CONSTRAINT ck_salary_structures_status
        CHECK (status IN ('Active', 'Inactive'))
);

CREATE INDEX idx_salary_structures_employee_effective
    ON salary_structures (employee_id, effective_from_date);

ALTER TABLE salary_structures
    ADD CONSTRAINT fk_salary_structures_employee
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- 3. attendance — daily check-in / check-out.
CREATE TABLE attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL,
    attendance_date date NOT NULL,
    check_in_time time,
    check_out_time time,
    total_hours decimal(4,2),
    status varchar(20) NOT NULL,
    is_late boolean NOT NULL DEFAULT false,
    late_minutes int NOT NULL DEFAULT 0,
    is_overtime boolean NOT NULL DEFAULT false,
    overtime_hours decimal(4,2) NOT NULL DEFAULT 0,
    marked_by varchar(20) NOT NULL DEFAULT 'Manual',
    cards_produced int NOT NULL DEFAULT 0,
    notes text,
    created_by uuid,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, attendance_date),
    CONSTRAINT ck_attendance_status
        CHECK (status IN ('Present', 'Absent', 'Half_Day', 'Leave', 'Holiday', 'Weekend')),
    CONSTRAINT ck_attendance_marked_by
        CHECK (marked_by IN ('Cashier_Self', 'Manual', 'Admin', 'System'))
);

CREATE INDEX idx_attendance_date ON attendance (attendance_date);

ALTER TABLE attendance
    ADD CONSTRAINT fk_attendance_employee
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- 4. attendance_summaries — monthly rollup, fed into payroll runs.
CREATE TABLE attendance_summaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL,
    month int NOT NULL,
    year int NOT NULL,
    total_working_days int NOT NULL,
    present_days int NOT NULL DEFAULT 0,
    absent_days int NOT NULL DEFAULT 0,
    leave_days int NOT NULL DEFAULT 0,
    half_days int NOT NULL DEFAULT 0,
    late_days int NOT NULL DEFAULT 0,
    total_overtime_hours decimal(6,2) NOT NULL DEFAULT 0,
    attendance_bonus_eligible boolean NOT NULL DEFAULT false,
    attendance_bonus_amount decimal(10,2) NOT NULL DEFAULT 0,
    summary_date date NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT uq_attendance_summaries_employee_month_year UNIQUE (employee_id, month, year)
);

ALTER TABLE attendance_summaries
    ADD CONSTRAINT fk_attendance_summaries_employee
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- 5. employee_leaves — request + approval workflow.
CREATE TABLE employee_leaves (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL,
    leave_type varchar(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days decimal(4,1) NOT NULL,
    reason text,
    status varchar(20) NOT NULL DEFAULT 'Pending',
    applied_date date NOT NULL,
    approved_by uuid,
    approved_date date,
    rejection_reason text,
    notes text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT ck_employee_leaves_type
        CHECK (leave_type IN ('Annual', 'Sick', 'Casual', 'No_Pay', 'Maternity', 'Paternity')),
    CONSTRAINT ck_employee_leaves_status
        CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled'))
);

ALTER TABLE employee_leaves
    ADD CONSTRAINT fk_employee_leaves_employee
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_employee_leaves_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- 6. payroll_settings — per-branch + a single global default row.
CREATE TABLE payroll_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id uuid,
    epf_employee_percent decimal(5,2) NOT NULL DEFAULT 8.00,
    epf_employer_percent decimal(5,2) NOT NULL DEFAULT 12.00,
    etf_employer_percent decimal(5,2) NOT NULL DEFAULT 3.00,
    attendance_bonus_threshold int NOT NULL DEFAULT 26,
    late_grace_minutes int NOT NULL DEFAULT 15,
    created_by uuid,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

-- Per-branch override: at most one row per branch.
CREATE UNIQUE INDEX uq_payroll_settings_branch_not_null
    ON payroll_settings (branch_id) WHERE branch_id IS NOT NULL;
-- Global default: at most one row with branch_id IS NULL.
CREATE UNIQUE INDEX uq_payroll_settings_global
    ON payroll_settings ((branch_id IS NULL)) WHERE branch_id IS NULL;

ALTER TABLE payroll_settings
    ADD CONSTRAINT fk_payroll_settings_branch
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_payroll_settings_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 7. payrolls — monthly payroll run per employee.
CREATE TABLE payrolls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL,
    pay_period_month int NOT NULL,
    pay_period_year int NOT NULL,
    basic_salary decimal(10,2) NOT NULL DEFAULT 0,
    production_earnings decimal(10,2) NOT NULL DEFAULT 0,
    overtime_earnings decimal(10,2) NOT NULL DEFAULT 0,
    attendance_bonus decimal(10,2) NOT NULL DEFAULT 0,
    tea_allowance decimal(10,2) NOT NULL DEFAULT 0,
    other_allowances decimal(10,2) NOT NULL DEFAULT 0,
    gross_salary decimal(10,2) NOT NULL,
    epf_employee_deduction decimal(10,2) NOT NULL DEFAULT 0,
    etf_employee_deduction decimal(10,2) NOT NULL DEFAULT 0,
    advance_deduction decimal(10,2) NOT NULL DEFAULT 0,
    other_deductions decimal(10,2) NOT NULL DEFAULT 0,
    total_deductions decimal(10,2) NOT NULL,
    net_salary decimal(10,2) NOT NULL,
    epf_employer_contribution decimal(10,2) NOT NULL DEFAULT 0,
    etf_employer_contribution decimal(10,2) NOT NULL DEFAULT 0,
    payment_status varchar(20) NOT NULL DEFAULT 'Pending',
    payment_date date,
    payment_method varchar(20) NOT NULL DEFAULT 'Bank_Transfer',
    bank_reference_no varchar(100),
    pay_slip_generated boolean NOT NULL DEFAULT false,
    pay_slip_url varchar(255),
    notes text,
    other_deductions_reason text,
    other_allowances_reason text,
    generated_by uuid,
    approved_by uuid,
    generated_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT uq_payrolls_employee_period UNIQUE (employee_id, pay_period_month, pay_period_year),
    CONSTRAINT ck_payrolls_payment_status
        CHECK (payment_status IN ('Pending', 'Approved', 'Paid', 'Cancelled')),
    CONSTRAINT ck_payrolls_payment_method
        CHECK (payment_method IN ('Cash', 'Bank_Transfer', 'Cheque'))
);

ALTER TABLE payrolls
    ADD CONSTRAINT fk_payrolls_employee
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_payrolls_generated_by
        FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_payrolls_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- 8. Seed the global default payroll_settings row (Sri Lankan
--    statutory rates). Guarded so re-runs do not violate the partial
--    unique on branch_id IS NULL.
INSERT INTO payroll_settings (
    branch_id,
    epf_employee_percent,
    epf_employer_percent,
    etf_employer_percent,
    attendance_bonus_threshold,
    late_grace_minutes
)
SELECT NULL, 8.00, 12.00, 3.00, 26, 15
WHERE NOT EXISTS (
    SELECT 1 FROM payroll_settings WHERE branch_id IS NULL
);

COMMIT;
