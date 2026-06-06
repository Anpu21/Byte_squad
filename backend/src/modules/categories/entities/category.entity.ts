import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Category — a managed product category (Phase: category management).
 *
 * Replaces the previous free-form `products.category` string with a real
 * lookup table that Managers and Admins maintain. `Product.categoryId` is the
 * source of truth; `Product.category` (string) is kept as a synced denormalized
 * mirror so existing readers (inventory filter, shop catalog, POS productType)
 * keep working unchanged. Categories are global — the branch dimension lives in
 * the sales analytics, which scope by `sale.branch_id`.
 */
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Named index so TypeORM sync (dev) and the CreateCategories migration (prod)
  // converge on the same object instead of creating two uniqueness checks.
  @Index('UQ_categories_name', { unique: true })
  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  // Optional hex/token used to colour the category chip + analytics bar.
  @Column({ type: 'varchar', length: 16, nullable: true })
  color!: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder!: number;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
