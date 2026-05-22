import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';
import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';

@Entity('loyalty_ledger_entries')
@Index(['userId'])
@Index(['orderId'])
export class LoyaltyLedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId!: string | null;

  @ManyToOne(() => CustomerOrder, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order!: CustomerOrder | null;

  @Column({
    type: 'enum',
    enum: LoyaltyLedgerEntryType,
  })
  type!: LoyaltyLedgerEntryType;

  @Column({ type: 'int' })
  points!: number;

  @Column({ type: 'varchar' })
  description!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, string | number | boolean | null> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
