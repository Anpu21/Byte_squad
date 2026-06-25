import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DiscountType } from '@/common/enums/discount.enum';
import { Sale } from '@/modules/pos-sales/entities/sale.entity';
import { Product } from '@products/entities/product.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import type { PriceLevel } from '@/modules/pos-sales/types';

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

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity!: number;

  // Quantity in the product's canonical base unit, after the per-product
  // sellable-unit conversion has been applied (e.g. 1000 g typed against a
  // kg-based product → 1.000 kg here). Mirrors the inventory.quantity scale
  // exactly so void/return flows can reconstruct what the cashier rang up.
  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'base_unit_qty' })
  baseUnitQty!: number;

  // Which ProductSellableUnit row was selected at the till. NULL when the
  // line was rung in the product's base unit directly (no conversion row
  // was used). ON DELETE SET NULL because a unit can be retired after the
  // sale has been printed.
  @Column({ type: 'uuid', name: 'unit_id', nullable: true })
  unitId!: string | null;

  @ManyToOne(() => ProductSellableUnit, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'unit_id' })
  unit!: ProductSellableUnit | null;

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

  // -----------------------------------------------------------------
  // Phase 2 — Shanel-port columns
  // -----------------------------------------------------------------
  @Column({
    type: 'varchar',
    length: 32,
    name: 'price_level_used',
    default: 'Retail',
  })
  priceLevelUsed!: PriceLevel;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'line_discount_percentage',
    default: 0,
  })
  lineDiscountPercentage!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'line_subtotal',
    default: 0,
  })
  lineSubtotal!: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'line_tax_rate',
    default: 0,
  })
  lineTaxRate!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'line_tax_amount',
    default: 0,
  })
  lineTaxAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  free!: number;

  @Column({
    type: 'varchar',
    length: 64,
    name: 'location_taken_from',
    default: 'Shop',
  })
  locationTakenFrom!: string;

  @Column({ type: 'varchar', length: 32, default: 'Active' })
  status!: 'Active' | 'Voided';
}
