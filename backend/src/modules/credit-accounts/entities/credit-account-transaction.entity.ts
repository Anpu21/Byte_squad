import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Sale } from '@pos/entities/sale.entity';
import { CreditAccount } from '@/modules/credit-accounts/entities/credit-account.entity';

export type CreditAccountTransactionType = 'Credit_Taken' | 'Credit_Paid';

/**
 * Append-only loan-book ledger for a {@link CreditAccount}. Structural mirror
 * of the User-bound `CreditTransaction`, keyed on `creditAccountId` instead of
 * `userId`. `Credit_Taken` rows are written when a customer buys on credit;
 * `Credit_Paid` rows when they repay (or a credit sale is voided). Each row
 * snapshots `runningBalance` so the statement reads without recomputation.
 */
@Entity('credit_account_transactions')
@Index(['creditAccountId', 'createdAt'])
export class CreditAccountTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'credit_account_id' })
  creditAccountId!: string;

  @ManyToOne(() => CreditAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'credit_account_id' })
  creditAccount!: CreditAccount;

  @Column({ type: 'uuid', name: 'sale_id', nullable: true })
  saleId!: string | null;

  @ManyToOne(() => Sale, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale | null;

  @Column({ type: 'varchar', length: 32, name: 'transaction_type' })
  transactionType!: CreditAccountTransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'running_balance',
  })
  runningBalance!: number;

  @Column({ type: 'varchar', length: 64, name: 'reference_no' })
  referenceNo!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
