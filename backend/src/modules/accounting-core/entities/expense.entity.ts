import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { ExpenseStatus } from '@common/enums/expense-status.enum';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator!: User;

  @Column({ type: 'varchar' })
  category!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar' })
  description!: string;

  @Column({ type: 'date', name: 'expense_date' })
  expenseDate!: Date;

  @Column({ type: 'varchar', name: 'receipt_url', nullable: true })
  receiptUrl!: string | null;

  @Column({
    type: 'enum',
    enum: ExpenseStatus,
    default: ExpenseStatus.PENDING,
  })
  status!: ExpenseStatus;

  @Column({ type: 'uuid', name: 'reviewed_by', nullable: true })
  reviewedBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer!: User | null;

  @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'text', name: 'review_note', nullable: true })
  reviewNote!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
