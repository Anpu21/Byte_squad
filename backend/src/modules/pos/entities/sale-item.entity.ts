import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DiscountType } from '@/common/enums/discount.enum';
import { Sale } from '@pos/entities/sale.entity';
import { Product } from '@products/entities/product.entity';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'sale_id' })
  saleId!: string;

  @ManyToOne(() => Sale, (sale) => sale.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.transactionItems, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price' })
  unitPrice!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'discount_amount',
    default: 0,
  })
  discountAmount!: number;

  @Column({
    type: 'enum',
    enum: DiscountType,
    name: 'discount_type',
    default: DiscountType.NONE,
  })
  discountType!: DiscountType;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'line_total' })
  lineTotal!: number;
}
