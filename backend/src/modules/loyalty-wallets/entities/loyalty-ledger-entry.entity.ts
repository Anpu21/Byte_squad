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

/**
 * Single immutable journal row for a loyalty wallet movement. Owner
 * is polymorphic: either user_id (online customer) or
 * loyalty_customer_id (walk-in). Exactly one is set; the CHECK +
 * partial unique pair are declared in `LoyaltyPhoneUniqueAndBranch`
 * (raw SQL — TypeORM decorators can't express partial uniques).
 *
 * `branchId` is nullable because online-store earns aren't tied to a
 * branch. Walk-in earns always carry the originating branch so the
 * admin can answer "which loyalty customers were active at branch X
 * since <date>" with a cheap index scan (see
 * `idx_loyalty_ledger_branch_created_at`).
 */
@Entity('loyalty_ledger_entries')
@Index(['userId'])
@Index(['orderId'])
@Index(['loyaltyCustomerId'])
@Index(['branchId'])
export class LoyaltyLedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId!: string | null;

  @Column({ type: 'uuid', name: 'loyalty_customer_id', nullable: true })
  loyaltyCustomerId!: string | null;

  @Column({ type: 'uuid', name: 'branch_id', nullable: true })
  branchId!: string | null;

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
