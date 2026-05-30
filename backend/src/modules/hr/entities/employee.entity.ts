import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * HR profile for a staff member. Branch-scoped (`branchId` is required),
 * with an optional `userId` that links employees who also log in to
 * LedgerPro (cashier / manager) — a single user can have at most one
 * employee record, enforced via a partial unique index in the
 * companion migration (TypeORM 0.3 cannot express partial uniques
 * reliably through decorators).
 *
 * Salary category lives in the time-bounded `salary_structures` table
 * — not on the employee row — so a raise produces a new structure
 * rather than mutating history.
 */
@Entity('employees')
@Index(['employeeCode'], { unique: true })
@Index(['branchId'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, name: 'employee_code' })
  employeeCode!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId!: string | null;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @Column({ type: 'varchar', length: 200, name: 'full_name' })
  fullName!: string;

  @Column({
    type: 'varchar',
    length: 200,
    name: 'name_with_initials',
    nullable: true,
  })
  nameWithInitials!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nic!: string | null;

  @Column({ type: 'date', name: 'date_of_birth', nullable: true })
  dateOfBirth!: Date | null;

  @Column({
    type: 'enum',
    enum: ['Male', 'Female', 'Other'],
    nullable: true,
  })
  gender!: 'Male' | 'Female' | 'Other' | null;

  @Column({
    type: 'enum',
    enum: ['Single', 'Married', 'Divorced', 'Widowed'],
    name: 'marital_status',
    nullable: true,
  })
  maritalStatus!: 'Single' | 'Married' | 'Divorced' | 'Widowed' | null;

  @Column({ type: 'varchar', length: 16, name: 'contact_phone' })
  contactPhone!: string;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'contact_phone_2',
    nullable: true,
  })
  contactPhone2!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email!: string | null;

  @Column({ type: 'text', name: 'permanent_address', nullable: true })
  permanentAddress!: string | null;

  @Column({ type: 'text', name: 'current_address', nullable: true })
  currentAddress!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({
    type: 'varchar',
    length: 200,
    name: 'emergency_contact_name',
    nullable: true,
  })
  emergencyContactName!: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'emergency_contact_phone',
    nullable: true,
  })
  emergencyContactPhone!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'emergency_contact_relationship',
    nullable: true,
  })
  emergencyContactRelationship!: string | null;

  @Column({ type: 'date', name: 'hire_date' })
  hireDate!: Date;

  @Column({ type: 'date', name: 'confirmation_date', nullable: true })
  confirmationDate!: Date | null;

  @Column({
    type: 'enum',
    enum: ['Permanent', 'Contract', 'Casual', 'Intern'],
    name: 'employee_type',
    default: 'Permanent',
  })
  employeeType!: 'Permanent' | 'Contract' | 'Casual' | 'Intern';

  @Column({ type: 'varchar', length: 100 })
  role!: string;

  @Column({
    type: 'time',
    name: 'working_hours_start',
    default: '08:00:00',
  })
  workingHoursStart!: string;

  @Column({
    type: 'time',
    name: 'working_hours_end',
    default: '16:00:00',
  })
  workingHoursEnd!: string;

  @Column({ type: 'boolean', name: 'epf_eligible', default: false })
  epfEligible!: boolean;

  @Column({ type: 'boolean', name: 'etf_eligible', default: false })
  etfEligible!: boolean;

  @Column({ type: 'varchar', length: 50, name: 'epf_number', nullable: true })
  epfNumber!: string | null;

  @Column({ type: 'varchar', length: 50, name: 'etf_number', nullable: true })
  etfNumber!: string | null;

  @Column({ type: 'varchar', length: 100, name: 'bank_name', nullable: true })
  bankName!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'bank_account_no',
    nullable: true,
  })
  bankAccountNo!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'bank_branch',
    nullable: true,
  })
  bankBranch!: string | null;

  @Column({
    type: 'varchar',
    length: 200,
    name: 'bank_account_name',
    nullable: true,
  })
  bankAccountName!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status!: string;

  @Column({ type: 'date', name: 'resignation_date', nullable: true })
  resignationDate!: Date | null;

  @Column({ type: 'text', name: 'resignation_reason', nullable: true })
  resignationReason!: string | null;

  @Column({ type: 'date', name: 'termination_date', nullable: true })
  terminationDate!: Date | null;

  @Column({ type: 'text', name: 'termination_reason', nullable: true })
  terminationReason!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'photo_url',
    nullable: true,
  })
  photoUrl!: string | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 1,
    name: 'annual_leave_balance',
    default: 14,
    transformer: {
      to: (v: number) => v,
      from: (v: string | number | null) =>
        v === null || v === undefined ? 0 : Number(v),
    },
  })
  annualLeaveBalance!: number;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
