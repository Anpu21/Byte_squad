import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import type { HeldSaleSnapshot } from '@pos/types/held-sale-snapshot.type';

/**
 * A parked (suspended) in-progress sale. The cart is snapshotted as opaque
 * jsonb so a bill held on one terminal can be recalled on any other within
 * the branch. Deliberately carries NO inventory or ledger links — a held
 * cart must not reserve stock or post anything until it is resumed and
 * checked out through the normal sale-write path.
 */
@Entity('held_sales')
@Index(['branchId'])
export class HeldSale {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'uuid', name: 'cashier_id' })
  cashierId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cashier_id' })
  cashier!: User;

  /** Display hint — customer name or first item. */
  @Column({ type: 'varchar', length: 120 })
  label!: string;

  @Column({ type: 'int', name: 'item_count' })
  itemCount!: number;

  /** Cached cart total for the shelf view; re-priced at checkout. */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: number;

  @Column({ type: 'jsonb' })
  snapshot!: HeldSaleSnapshot;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
