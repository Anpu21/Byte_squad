import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type DiscountSchemeScope = 'Product' | 'Category';

/**
 * Automatic POS discount rule: while active and inside its date window,
 * matching cart lines (by product or category, optionally gated on a
 * minimum quantity slab) get `discountPercentage` applied at add-time.
 * The cashier's manual discount always wins over a scheme.
 */
@Entity('discount_schemes')
@Index(['isActive'])
export class DiscountScheme {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  /** NULL = every branch. */
  @Column({ type: 'uuid', name: 'branch_id', nullable: true })
  branchId!: string | null;

  @Column({ type: 'varchar', length: 16 })
  scope!: DiscountSchemeScope;

  /** Set when scope = Product. */
  @Column({ type: 'uuid', name: 'product_id', nullable: true })
  productId!: string | null;

  /** Set when scope = Category (matches Product.category). */
  @Column({ type: 'varchar', length: 120, nullable: true })
  category!: string | null;

  /** Quantity slab — the line qty must reach this for the rule to bite. */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'min_qty',
    default: 0,
  })
  minQty!: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'discount_percentage',
  })
  discountPercentage!: number;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
