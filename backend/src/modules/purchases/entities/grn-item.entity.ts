import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { Grn } from '@/modules/purchases/entities/grn.entity';

/** One received line on a GRN — quantity in base units at a unit cost. */
@Entity('grn_items')
@Index(['grnId'])
@Index(['productId'])
export class GrnItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'grn_id' })
  grnId!: string;

  @ManyToOne(() => Grn, (grn) => grn.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grn_id' })
  grn!: Grn;

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

  @Column({ type: 'varchar', length: 64, name: 'batch_no', nullable: true })
  batchNo!: string | null;

  @Column({ type: 'date', name: 'expiry_date', nullable: true })
  expiryDate!: string | null;
}
