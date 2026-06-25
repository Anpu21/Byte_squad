import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';
import { StockAdjustmentReason } from '@common/enums/stock-adjustment-reason.enum';
import { StockAdjustmentStatus } from '@common/enums/stock-adjustment-status.enum';

/**
 * StockAdjustment — a reason-coded inventory correction (Phase C2).
 *
 * The adjustment captures a physical count: `physicalQuantity` becomes the new
 * on-hand and `difference` (= physical − before) records the delta. Applying an
 * adjustment also appends a `StockMovement` of type `Adjustment` so the audit
 * ledger stays complete. Admin (and small manager) corrections apply
 * immediately; large manager corrections wait on admin approval. Reversals undo
 * the delta and write a compensating movement.
 */
@Entity('stock_adjustments')
@Index(['branchId', 'status', 'createdAt'])
@Index(['productId', 'branchId'])
export class StockAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'varchar', length: 20 })
  reason!: StockAdjustmentReason;

  @Column({
    type: 'varchar',
    length: 16,
    default: StockAdjustmentStatus.APPROVED,
  })
  status!: StockAdjustmentStatus;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'quantity_before',
  })
  quantityBefore!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'physical_quantity',
  })
  physicalQuantity!: number;

  // physical − before; negative when stock was lost.
  @Column({ type: 'decimal', precision: 12, scale: 3 })
  difference!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @Column({ type: 'uuid', name: 'reviewed_by_user_id', nullable: true })
  reviewedByUserId!: string | null;

  @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'uuid', name: 'reversed_by_user_id', nullable: true })
  reversedByUserId!: string | null;

  @Column({ type: 'timestamp', name: 'reversed_at', nullable: true })
  reversedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
