import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { CustomerRequest } from '@/modules/customer-requests/entities/customer-request.entity';

@Entity('customer_request_items')
export class CustomerRequestItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'request_id' })
  requestId!: string;

  @ManyToOne(() => CustomerRequest, (req) => req.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'request_id' })
  request!: CustomerRequest;

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
