import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { Branch } from '@branches/entities/branch.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', name: 'first_name' })
  firstName!: string;

  @Column({ type: 'varchar', name: 'last_name' })
  lastName!: string;

  @Column({ type: 'varchar', name: 'avatar_url', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CASHIER })
  role!: UserRole;

  @Column({ type: 'uuid', name: 'branch_id', nullable: true })
  branchId!: string | null;

  @ManyToOne(() => Branch, (branch) => branch.users, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', nullable: true })
  address!: string | null;

  /**
   * Preferred UI language (BCP-47-ish short code: 'en', 'ta'). Saved from
   * profile settings so the choice follows the user across devices; the
   * frontend also caches it in localStorage for instant first paint.
   */
  @Column({ type: 'varchar', length: 8, name: 'language', default: 'en' })
  language!: string;

  @Column({ type: 'boolean', name: 'is_first_login', default: true })
  isFirstLogin!: boolean;

  @Column({ type: 'varchar', name: 'otp_code', nullable: true })
  otpCode!: string | null;

  @Column({ type: 'timestamp', name: 'otp_expires_at', nullable: true })
  otpExpiresAt!: Date | null;

  @Column({ type: 'boolean', name: 'is_verified', default: false })
  isVerified!: boolean;

  @Column({ type: 'timestamp', name: 'last_login_at', nullable: true })
  lastLoginAt!: Date | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'current_balance',
    default: 0,
  })
  currentBalance!: number;

  /**
   * Max credit a customer may carry (`currentBalance` ceiling at POS
   * checkout). NULL = unlimited — preserves pre-limit behavior.
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'credit_limit',
    nullable: true,
  })
  creditLimit!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
