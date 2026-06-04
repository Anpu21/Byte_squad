import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from '@products/entities/product.entity';

/**
 * One sellable unit of a product (e.g. eggs sold loose OR as a 12-PACK).
 * Each row carries a `conversionToBase` factor that converts the typed
 * quantity into the product's canonical base unit before inventory is touched.
 *
 * The cashier picks one of these rows when entering a line; the column
 * `is_base` marks the canonical unit (conversion factor = 1).
 *
 * Layout matches the Shanel ERP `product_sellable_units` table: one row per
 * (product, name) pair, ordered for the UI via `display_order`.
 */
@Entity('product_sellable_units')
@Unique(['productId', 'name'])
@Index('idx_product_sellable_units_product', ['productId'])
@Index('uq_product_sellable_units_barcode', ['barcode'], {
  unique: true,
  where: 'barcode IS NOT NULL',
})
export class ProductSellableUnit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.sellableUnits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'varchar', length: 32 })
  name!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  barcode!: string | null;

  @Column({ type: 'boolean', name: 'is_base', default: false })
  isBase!: boolean;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 6,
    name: 'conversion_to_base',
    default: 1,
  })
  conversionToBase!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'selling_price',
    default: 0,
  })
  sellingPrice!: number;

  @Column({ type: 'integer', name: 'display_order', default: 0 })
  displayOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
