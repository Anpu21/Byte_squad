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

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'unit_price_snapshot',
  })
  unitPriceSnapshot!: number;
}
