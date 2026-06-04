import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Inventory } from '@inventory/entities/inventory.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  barcode!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar' })
  category!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cost_price' })
  costPrice!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'selling_price' })
  sellingPrice!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'wholesale_price',
    default: 0,
  })
  wholesalePrice!: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'tax_rate',
    default: 0,
  })
  taxRate!: number;

  @Column({ type: 'boolean', name: 'discount_allowed', default: true })
  discountAllowed!: boolean;

  @Column({ type: 'varchar', length: 32, name: 'base_unit', default: 'unit' })
  baseUnit!: string;

  @Column({ type: 'varchar', name: 'image_url', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventoryRecords!: Inventory[];

  @OneToMany(() => SaleItem, (item) => item.product)
  transactionItems!: SaleItem[];

  @OneToMany(() => ProductSellableUnit, (unit) => unit.product)
  sellableUnits?: ProductSellableUnit[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
