import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

const percentTransformer = {
  to: (v: number) => v,
  from: (v: string | number | null) =>
    v === null || v === undefined ? 0 : Number(v),
};

/**
 * Statutory + house-rule payroll knobs. One row per branch (override)
 * plus exactly one global default row with `branchId = NULL`. The
 * "exactly one global" invariant and the per-branch uniqueness are
 * both enforced via partial unique indexes in the companion migration
 * — TypeORM 0.3 decorators cannot express partial uniques reliably.
 *
 * Defaults match Sri Lankan statutory rates (EPF 8% employee, 12%
 * employer; ETF 3% employer) so a fresh install can run payroll
 * without admin configuration.
 */
@Entity('payroll_settings')
export class PayrollSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'branch_id', nullable: true })
  branchId!: string | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'epf_employee_percent',
    default: 8.0,
    transformer: percentTransformer,
  })
  epfEmployeePercent!: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'epf_employer_percent',
    default: 12.0,
    transformer: percentTransformer,
  })
  epfEmployerPercent!: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'etf_employer_percent',
    default: 3.0,
    transformer: percentTransformer,
  })
  etfEmployerPercent!: number;

  @Column({
    type: 'int',
    name: 'attendance_bonus_threshold',
    default: 26,
  })
  attendanceBonusThreshold!: number;

  @Column({ type: 'int', name: 'late_grace_minutes', default: 15 })
  lateGraceMinutes!: number;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
