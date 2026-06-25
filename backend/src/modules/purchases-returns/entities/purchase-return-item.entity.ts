import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { PurchaseReturn } from '@/modules/purchases-returns/entities/purchase-return.entity';

/** One returned line — unit cost snapshots the originating GRN line. */
@Entity('purchase_return_items')
@Index(['purchaseReturnId'])
export class PurchaseReturnItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'purchase_return_id' })
  purchaseReturnId!: string;

  @ManyToOne(() => PurchaseReturn, (ret) => ret.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchase_return_id' })
  purchaseReturn!: PurchaseReturn;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_cost' })
  unitCost!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'line_total' })
  lineTotal!: number;
}
