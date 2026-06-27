import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';

@Entity('customer_order_items')
export class CustomerOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId!: string;

  @ManyToOne(() => CustomerOrder, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order!: CustomerOrder;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'unit_price_snapshot',
  })
  unitPriceSnapshot!: number;

  /** Chosen sellable unit; null = the product base unit. */
  @Column({ type: 'uuid', name: 'unit_id', nullable: true })
  unitId!: string | null;

  @Column({ type: 'varchar', length: 64, name: 'unit_label', nullable: true })
  unitLabel!: string | null;

  /** quantity × the unit's conversionToBase — the amount inventory decrements. */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'base_unit_qty',
    default: 0,
  })
  baseUnitQty!: number;

  /**
   * Fixed line total for a "buy by amount" loose order: the customer paid an
   * exact cash amount (e.g. "1000 Rs of bananas"), so this overrides
   * quantity × unitPriceSnapshot as the line's price. Null for normal
   * by-weight / by-count lines.
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'fixed_price_override',
    nullable: true,
  })
  fixedPriceOverride!: number | null;
}
