import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';

/**
 * Manual journal voucher header. Its lines are real `ledger_entries`
 * rows (tagged with `journal_voucher_id`), so the ledger page and every
 * account-dimensioned report pick them up with zero extra plumbing.
 * Balanced by construction: Σ debits = Σ credits = `total`.
 */
@Entity('journal_vouchers')
@Index(['branchId'])
export class JournalVoucher {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 24,
    name: 'voucher_number',
    unique: true,
  })
  voucherNumber!: string;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'date', name: 'entry_date' })
  entryDate!: string;

  @Column({ type: 'varchar', length: 500 })
  memo!: string;

  /** One side of the balanced entry (Σ debits = Σ credits = total). */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: number;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
