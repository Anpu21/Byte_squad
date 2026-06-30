import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Brand — a managed product brand (Phase: brand sales analytics).
 *
 * Mirrors {@link Category}: a lookup table that Managers and Admins maintain,
 * pivoted on by the brand sales-analytics page (one brand → many products).
 * `Product.brandId` is the source of truth; `Product.brand` (string) is a synced
 * denormalized mirror so list/filter readers keep working without a join.
 *
 * Unlike category, brand is OPTIONAL on a product — not every SKU belongs to a
 * brand (loose produce, in-house bakery). Brands are global; the branch
 * dimension lives in the analytics, which scope by `sale.branch_id`.
 */
@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Named index so TypeORM sync (dev) and the CreateBrands migration (prod)
  // converge on the same object instead of creating two uniqueness checks.
  @Index('UQ_brands_name', { unique: true })
  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  // Optional hex/token used to colour the brand chip + analytics chart slice.
  @Column({ type: 'varchar', length: 16, nullable: true })
  color!: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder!: number;

  // Nullable: brands auto-created from the product form's "type-new" datalist
  // have no acting user; brands created via the brands API carry the actor.
  @Column({ type: 'uuid', name: 'created_by_user_id', nullable: true })
  createdByUserId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
