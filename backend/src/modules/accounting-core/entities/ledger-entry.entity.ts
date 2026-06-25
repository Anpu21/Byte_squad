import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { Branch } from '@branches/entities/branch.entity';
import { Account } from '@/modules/accounting-core/entities/account.entity';

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'enum', enum: LedgerEntryType, name: 'entry_type' })
  entryType!: LedgerEntryType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar' })
  description!: string;

  @Column({ type: 'varchar', name: 'reference_number' })
  referenceNumber!: string;

  @Column({ type: 'uuid', name: 'sale_id', nullable: true })
  saleId!: string | null;

  /**
   * Chart-of-accounts dimension. Stamped on every new posting (explicit
   * `accountCode` from the caller, else classified from the reference);
   * pre-chart rows were backfilled by the CreateAccounts migration.
   */
  @Column({ type: 'uuid', name: 'account_id', nullable: true })
  accountId!: string | null;

  @ManyToOne(() => Account, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'account_id' })
  account!: Account | null;

  /** Set when this row is a line of a manual journal voucher. */
  @Column({ type: 'uuid', name: 'journal_voucher_id', nullable: true })
  journalVoucherId!: string | null;

  /**
   * Business date of the posting (`YYYY-MM-DD`) — what the financial
   * reports and fiscal-period locks key on. Defaults to the posting day;
   * journal vouchers may backdate it into any still-open month.
   */
  @Column({ type: 'date', name: 'entry_date' })
  entryDate!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
