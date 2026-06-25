import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
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
 * Daily attendance record. One row per (employee, date) — enforced by
 * the composite unique constraint so the same day cannot be marked
 * twice.
 *
 * `markedBy` distinguishes self-service check-in by a cashier user
 * from manual / admin / system entries — `Fingerprint` from the Shanel
 * ERP source has been replaced with `Cashier_Self` because LedgerPro
 * does not have biometric hardware. The branch context for an
 * attendance row is derived through the parent `employees.branch_id`
 * rather than denormalized here, matching the spec's MVP guidance.
 */
@Entity('attendance')
@Unique(['employeeId', 'attendanceDate'])
@Index(['attendanceDate'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId!: string;

  @Column({ type: 'date', name: 'attendance_date' })
  attendanceDate!: Date;

  @Column({ type: 'time', name: 'check_in_time', nullable: true })
  checkInTime!: string | null;

  @Column({ type: 'time', name: 'check_out_time', nullable: true })
  checkOutTime!: string | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    name: 'total_hours',
    nullable: true,
    transformer: {
      to: (v: number | null) => v,
      from: (v: string | number | null) =>
        v === null || v === undefined ? null : Number(v),
    },
  })
  totalHours!: number | null;

  @Column({
    type: 'enum',
    enum: ['Present', 'Absent', 'Half_Day', 'Leave', 'Holiday', 'Weekend'],
  })
  status!: 'Present' | 'Absent' | 'Half_Day' | 'Leave' | 'Holiday' | 'Weekend';

  @Column({ type: 'boolean', name: 'is_late', default: false })
  isLate!: boolean;

  @Column({ type: 'int', name: 'late_minutes', default: 0 })
  lateMinutes!: number;

  @Column({ type: 'boolean', name: 'is_overtime', default: false })
  isOvertime!: boolean;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    name: 'overtime_hours',
    default: 0,
    transformer: decimalTransformer,
  })
  overtimeHours!: number;

  @Column({
    type: 'enum',
    enum: ['Cashier_Self', 'Manual', 'Admin', 'System'],
    name: 'marked_by',
    default: 'Manual',
  })
  markedBy!: 'Cashier_Self' | 'Manual' | 'Admin' | 'System';

  @Column({ type: 'int', name: 'cards_produced', default: 0 })
  cardsProduced!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
