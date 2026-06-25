import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Leave request lodged by (or on behalf of) an employee. The approval
 * workflow flips `status` from `Pending` -> `Approved` / `Rejected` /
 * `Cancelled`, and an Approved leave drives the corresponding day(s)
 * in `attendance` to be classified as Leave rather than Absent.
 *
 * `totalDays` is `decimal(4,1)` so a half-day leave (0.5) can be
 * stored without rounding.
 */
@Entity('employee_leaves')
export class EmployeeLeave {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId!: string;

  @Column({
    type: 'enum',
    enum: ['Annual', 'Sick', 'Casual', 'No_Pay', 'Maternity', 'Paternity'],
    name: 'leave_type',
  })
  leaveType!:
    | 'Annual'
    | 'Sick'
    | 'Casual'
    | 'No_Pay'
    | 'Maternity'
    | 'Paternity';

  @Column({ type: 'date', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: Date;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 1,
    name: 'total_days',
    transformer: {
      to: (v: number) => v,
      from: (v: string | number | null) =>
        v === null || v === undefined ? 0 : Number(v),
    },
  })
  totalDays!: number;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending',
  })
  status!: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

  @Column({ type: 'date', name: 'applied_date' })
  appliedDate!: Date;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy!: string | null;

  @Column({ type: 'date', name: 'approved_date', nullable: true })
  approvedDate!: Date | null;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
