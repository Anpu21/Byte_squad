import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

const decimalTransformer = {
  to: (v: number) => v,
  from: (v: string | number | null) =>
    v === null || v === undefined ? 0 : Number(v),
};

/**
 * Monthly payroll run for one employee. One row per (employee, month,
 * year) — re-generating a period overwrites the same row, but the
 * `paymentStatus` machine + `paymentDate` + `bankReferenceNo` mean
 * regenerating a *paid* row is a policy decision the service layer
 * (BE-H2+) must reject.
 *
 * Deletion is `ON DELETE RESTRICT` on the employee FK so that paid
 * payroll history cannot be silently lost when an employee record is
 * removed.
 */
@Entity('payrolls')
@Unique(['employeeId', 'payPeriodMonth', 'payPeriodYear'])
export class Payroll {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId!: string;

  @Column({ type: 'int', name: 'pay_period_month' })
  payPeriodMonth!: number;

  @Column({ type: 'int', name: 'pay_period_year' })
  payPeriodYear!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'basic_salary',
    default: 0,
    transformer: decimalTransformer,
  })
  basicSalary!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'production_earnings',
    default: 0,
    transformer: decimalTransformer,
  })
  productionEarnings!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'overtime_earnings',
    default: 0,
    transformer: decimalTransformer,
  })
  overtimeEarnings!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'attendance_bonus',
    default: 0,
    transformer: decimalTransformer,
  })
  attendanceBonus!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'tea_allowance',
    default: 0,
    transformer: decimalTransformer,
  })
  teaAllowance!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'other_allowances',
    default: 0,
    transformer: decimalTransformer,
  })
  otherAllowances!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'gross_salary',
    transformer: decimalTransformer,
  })
  grossSalary!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'epf_employee_deduction',
    default: 0,
    transformer: decimalTransformer,
  })
  epfEmployeeDeduction!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'etf_employee_deduction',
    default: 0,
    transformer: decimalTransformer,
  })
  etfEmployeeDeduction!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'advance_deduction',
    default: 0,
    transformer: decimalTransformer,
  })
  advanceDeduction!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'other_deductions',
    default: 0,
    transformer: decimalTransformer,
  })
  otherDeductions!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'total_deductions',
    transformer: decimalTransformer,
  })
  totalDeductions!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'net_salary',
    transformer: decimalTransformer,
  })
  netSalary!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'epf_employer_contribution',
    default: 0,
    transformer: decimalTransformer,
  })
  epfEmployerContribution!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'etf_employer_contribution',
    default: 0,
    transformer: decimalTransformer,
  })
  etfEmployerContribution!: number;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Approved', 'Paid', 'Cancelled'],
    name: 'payment_status',
    default: 'Pending',
  })
  paymentStatus!: 'Pending' | 'Approved' | 'Paid' | 'Cancelled';

  @Column({ type: 'date', name: 'payment_date', nullable: true })
  paymentDate!: Date | null;

  @Column({
    type: 'enum',
    enum: ['Cash', 'Bank_Transfer', 'Cheque'],
    name: 'payment_method',
    default: 'Bank_Transfer',
  })
  paymentMethod!: 'Cash' | 'Bank_Transfer' | 'Cheque';

  @Column({
    type: 'varchar',
    length: 100,
    name: 'bank_reference_no',
    nullable: true,
  })
  bankReferenceNo!: string | null;

  @Column({ type: 'boolean', name: 'pay_slip_generated', default: false })
  paySlipGenerated!: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'pay_slip_url',
    nullable: true,
  })
  paySlipUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'text', name: 'other_deductions_reason', nullable: true })
  otherDeductionsReason!: string | null;

  @Column({ type: 'text', name: 'other_allowances_reason', nullable: true })
  otherAllowancesReason!: string | null;

  @Column({ type: 'uuid', name: 'generated_by', nullable: true })
  generatedBy!: string | null;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy!: string | null;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
