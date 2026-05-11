import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { Transaction } from '@pos/entities/transaction.entity';

// Stores the X-Idempotency-Key sent by the POS client and the resulting
// transaction id. A second request with the same (cashier, key) pair returns
// the original transaction instead of creating a duplicate. Rows older than
// 24 h can be pruned by a periodic job (Rules.md §2.4).
@Entity('pos_idempotency_keys')
@Index(['cashierId', 'key'], { unique: true })
export class IdempotencyKey {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  key!: string;

  @Column({ type: 'uuid', name: 'cashier_id' })
  cashierId!: string;

  @Column({ type: 'uuid', name: 'transaction_id' })
  transactionId!: string;

  @ManyToOne(() => Transaction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  transaction!: Transaction;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
