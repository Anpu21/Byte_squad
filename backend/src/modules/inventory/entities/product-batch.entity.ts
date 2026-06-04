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

/**
 * ProductBatch — a physical goods-receipt lot for a (product, branch) with an
 * optional batch/lot number and expiry date (Phase C1).
 *
 * `inventory.quantity` stays the authoritative sell-from total; batches are an
 * additive tracking layer that powers the expiry report and expiry alerts.
 * Multiple live expiry dates per product are why this is its own table rather
 * than flat columns on `inventory` (which is one row per product/branch).
 *
 * FEFO-at-POS (selling from the nearest-expiry batch) is intentionally out of
 * scope for C1 — see docs/feature-gap-analysis-shanel-erp.md.
 */
@Entity('product_batches')
@Index(['branchId', 'expiryDate'])
@Index(['productId', 'branchId'])
export class ProductBatch {
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

  @Column({ type: 'varchar', length: 64, name: 'batch_no', nullable: true })
  batchNo!: string | null;

  // Calendar day, not a timestamp — expiry is a date.
  @Column({ type: 'date', name: 'expiry_date', nullable: true })
  expiryDate!: string | null;

  // Quantity received in this batch, in the product's base unit (decimal(12,3)
  // to mirror inventory.quantity and survive fractional/loose stock).
  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity!: number;

  @Column({ type: 'timestamp', name: 'received_at', default: () => 'now()' })
  receivedAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
