import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Sale } from '@/modules/pos-sales/entities/sale.entity';
import { User } from '@users/entities/user.entity';

export type CreditTransactionType = 'Credit_Taken' | 'Credit_Paid';

@Entity('credit_transactions')
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid', name: 'sale_id', nullable: true })
  saleId!: string | null;

  @ManyToOne(() => Sale, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale | null;

  @Column({ type: 'varchar', length: 32, name: 'transaction_type' })
  transactionType!: CreditTransactionType;

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
