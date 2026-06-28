import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { CreditAccountStatus } from '@common/enums/credit-account-status.enum';

/**
 * CreditAccount — a customer store-credit ("khata"/loan-book) account.
 *
 * The digital version of the shopkeeper's manual ledger: a physical/walk-in
 * customer who has been approved to "buy now, pay later". Distinct from the
 * existing User-bound receivables (`User.currentBalance`) — those serve
 * registered/online customers, while this serves walk-ins who have no login
 * (User.email + passwordHash are both required, so a User per walk-in is not
 * viable). A credit sale links here via `Sale.creditAccountId`, never
 * `Sale.customerUserId`, so the two systems never overlap.
 *
 * Accounts are **branch-owned** (`branchId`): each branch manager approves and
 * scopes their own credit customers. The `(branch_id, phone)` uniqueness makes
 * the phone the per-branch lookup key (mirrors how walk-ins are found at POS).
 */
@Entity('credit_accounts')
@Index('UQ_credit_accounts_branch_phone', ['branchId', 'phone'], {
  unique: true,
})
@Index(['branchId', 'status'])
@Index(['status', 'createdAt'])
export class CreditAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Human-friendly reference (e.g. `KH-3F9A2B7C`), generated on enrollment.
  @Index('UQ_credit_accounts_account_no', { unique: true })
  @Column({ type: 'varchar', length: 24, name: 'account_no' })
  accountNo!: string;

  @Column({ type: 'varchar', name: 'holder_name' })
  holderName!: string;

  @Column({ type: 'varchar', length: 16 })
  phone!: string;

  // National ID / identity reference — optional, captured for creditworthiness.
  @Column({ type: 'varchar', length: 32, nullable: true })
  nic!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({
    type: 'varchar',
    length: 16,
    default: CreditAccountStatus.PENDING,
  })
  status!: CreditAccountStatus;

  // Set by the manager on approval. NULL = unlimited (a value is required to
  // move to ACTIVE; the service enforces that).
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'credit_limit',
    nullable: true,
  })
  creditLimit!: number | null;

  // Repayment window in days, set by the manager on approval. A credit sale
  // stamps `Sale.dueDate = saleDate + creditTermDays` (mirrors GRN/supplier).
  @Column({ type: 'int', name: 'credit_term_days', nullable: true })
  creditTermDays!: number | null;

  // Outstanding amount owed (positive = customer owes the store). Authoritative
  // running total, mutated under a row lock by charge/repayment.
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'current_balance',
    default: 0,
  })
  currentBalance!: number;

  // The cashier's suggested limit on the enrollment form (advisory only).
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'requested_credit_limit',
    nullable: true,
  })
  requestedCreditLimit!: number | null;

  // Optional links if the holder also exists as a registered User or a
  // walk-in LoyaltyCustomer (matched by phone). Scalar-only — no relation —
  // to keep this entity decoupled from those modules.
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId!: string | null;

  @Column({ type: 'uuid', name: 'loyalty_customer_id', nullable: true })
  loyaltyCustomerId!: string | null;

  @Column({ type: 'uuid', name: 'requested_by_user_id' })
  requestedByUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedBy!: User;

  @Column({ type: 'uuid', name: 'reviewed_by_user_id', nullable: true })
  reviewedByUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewedBy!: User | null;

  @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'text', name: 'request_note', nullable: true })
  requestNote!: string | null;

  @Column({ type: 'text', name: 'approval_note', nullable: true })
  approvalNote!: string | null;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
