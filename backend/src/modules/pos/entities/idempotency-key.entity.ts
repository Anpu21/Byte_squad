import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { Sale } from '@pos/entities/sale.entity';

// Stores the X-Idempotency-Key sent by the POS client and the resulting
// transaction id. A second request with the same (cashier, key) pair returns
// the original transaction instead of creating a duplicate. Rows older than
// 24 h can be pruned by a periodic job (Rules.md §2.4).
//
// SCOPE: per cashier. The unique index is on `(cashier_id, key)`, NOT on
// `key` alone. This matches the lookup in PosWriteService.createSale
// (`pos.findIdempotencyKey(actor.id, key)`) and the customer-orders
// idempotency model — two different cashiers can independently submit the
// same X-Idempotency-Key value without colliding. Replays only fire when
// the SAME cashier resubmits the same key.
@Entity('pos_idempotency_keys')
@Index(['cashierId', 'key'], { unique: true })
export class IdempotencyKey {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  key!: string;

  @Column({ type: 'uuid', name: 'cashier_id' })
  cashierId!: string;

  @Column({ type: 'uuid', name: 'sale_id' })
  saleId!: string;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
