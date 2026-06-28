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
import { Inventory } from '@inventory/entities/inventory.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
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

  // Short numeric item code embedded in retail-scale barcodes (EAN-13 `2`-prefix)
  // for weigh-by-weight products. Nullable; partial-unique (see migration) so a
  // scanned PLU resolves to exactly one product. Only kg/l products set it.
  @Column({ type: 'varchar', length: 16, name: 'plu_code', nullable: true })
  pluCode!: string | null;

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

  // Denormalized review aggregates, recomputed transactionally by
  // ReviewsService on every review write so the shop catalog + product page
  // render stars without a join. Source of truth = the product_reviews table.
  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    name: 'avg_rating',
    default: 0,
  })
  avgRating!: number;

  @Column({ type: 'int', name: 'review_count', default: 0 })
  reviewCount!: number;

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
