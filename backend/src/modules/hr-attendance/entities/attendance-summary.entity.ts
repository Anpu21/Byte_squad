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
 * Monthly rollup of attendance per employee. Generated alongside the
 * payroll run so the same numbers (present / absent / leave / late /
 * OT) feed both the pay-slip and the attendance bonus computation.
 *
 * Unique on (employee_id, month, year) so re-running a monthly close
 * cleanly overwrites a single canonical row per period.
 */
@Entity('attendance_summaries')
@Unique(['employeeId', 'month', 'year'])
export class AttendanceSummary {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId!: string;

  @Column({ type: 'int' })
  month!: number;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'int', name: 'total_working_days' })
  totalWorkingDays!: number;

  @Column({ type: 'int', name: 'present_days', default: 0 })
  presentDays!: number;

  @Column({ type: 'int', name: 'absent_days', default: 0 })
  absentDays!: number;

  @Column({ type: 'int', name: 'leave_days', default: 0 })
  leaveDays!: number;

  @Column({ type: 'int', name: 'half_days', default: 0 })
  halfDays!: number;

  @Column({ type: 'int', name: 'late_days', default: 0 })
  lateDays!: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    name: 'total_overtime_hours',
    default: 0,
    transformer: decimalTransformer,
  })
  totalOvertimeHours!: number;

  @Column({
    type: 'boolean',
    name: 'attendance_bonus_eligible',
    default: false,
  })
  attendanceBonusEligible!: boolean;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'attendance_bonus_amount',
    default: 0,
    transformer: decimalTransformer,
  })
  attendanceBonusAmount!: number;

  @Column({ type: 'date', name: 'summary_date' })
  summaryDate!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
