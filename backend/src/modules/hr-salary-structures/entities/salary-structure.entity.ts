import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

const decimalTransformer = {
  to: (v: number) => v,
  from: (v: string | number | null) =>
    v === null || v === undefined ? 0 : Number(v),
};

/**
 * Per-employee, time-bounded compensation. A salary change creates a
 * new row (with a fresh `effectiveFromDate`) rather than mutating the
 * existing one, so payroll calculations can always look up the
 * structure that was active during a given pay period.
 *
 * `productionRatePerCard` keeps its Shanel-port name for parity with
 * the reference schema; for non-card production lines it represents
 * the rate paid per produced unit.
 */
@Entity('salary_structures')
@Index(['employeeId', 'effectiveFromDate'])
export class SalaryStructure {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId!: string;

  @Column({
    type: 'enum',
    enum: ['Monthly_Fixed', 'Production_Based'],
    name: 'salary_type',
  })
  salaryType!: 'Monthly_Fixed' | 'Production_Based';

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'monthly_base',
    default: 0,
    transformer: decimalTransformer,
  })
  monthlyBase!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'daily_rate',
    default: 0,
    transformer: decimalTransformer,
  })
  dailyRate!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'production_rate_per_card',
    default: 0,
    transformer: decimalTransformer,
  })
  productionRatePerCard!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'tea_allowance_daily',
    default: 60,
    transformer: decimalTransformer,
  })
  teaAllowanceDaily!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'ot_rate_per_hour',
    default: 400,
    transformer: decimalTransformer,
  })
  otRatePerHour!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'attendance_bonus_amount',
    default: 0,
    transformer: decimalTransformer,
  })
  attendanceBonusAmount!: number;

  @Column({ type: 'date', name: 'effective_from_date' })
  effectiveFromDate!: Date;

  @Column({ type: 'date', name: 'effective_to_date', nullable: true })
  effectiveToDate!: Date | null;

  @Column({
    type: 'enum',
    enum: ['Active', 'Inactive'],
    default: 'Active',
  })
  status!: 'Active' | 'Inactive';

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
