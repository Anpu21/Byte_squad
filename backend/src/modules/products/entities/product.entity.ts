import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Inventory } from '@/modules/inventory-core/entities/inventory.entity';
import { SaleItem } from '@/modules/pos-sales/entities/sale-item.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { Category } from '@/modules/categories/entities/category.entity';

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

  // Denormalized mirror of `categoryRef.name`, kept in sync by ProductsService.
  // Retained so existing readers (inventory filter, shop catalog, POS
  // productType, seeds, exports) keep working without a join.
  @Column({ type: 'varchar' })
  category!: string;

  // Source of truth for the product's category. Nullable at the DB level so a
  // DB_SYNC boot never fails on pre-existing rows; ProductsService always sets
  // it on create/update, and the FK guarantees integrity.
  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'category_id' })
  categoryRef!: Category | null;

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
