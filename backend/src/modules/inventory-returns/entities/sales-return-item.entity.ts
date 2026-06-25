import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesReturn } from '@/modules/inventory-returns/entities/sales-return.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';

/**
 * One returned line of a SalesReturn (Phase C3). Quantities are in the sold
 * unit; the base-unit equivalents drive the inventory restock so they match the
 * scale `inventory.quantity` / `sale_items.base_unit_qty` use.
 */
@Entity('sales_return_items')
export class SalesReturnItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'return_id' })
  returnId!: string;

  @ManyToOne(() => SalesReturn, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'return_id' })
  salesReturn!: SalesReturn;

  @Column({ type: 'uuid', name: 'sale_item_id' })
  saleItemId!: string;

  @ManyToOne(() => SaleItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sale_item_id' })
  saleItem!: SaleItem;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'good_quantity' })
  goodQuantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'bad_quantity' })
  badQuantity!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'base_unit_qty_good',
    default: 0,
  })
  baseUnitQtyGood!: number;

  @Column({ type: 'boolean', name: 'restock_good', default: true })
  restockGood!: boolean;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'refund_amount',
    default: 0,
  })
  refundAmount!: number;
}
