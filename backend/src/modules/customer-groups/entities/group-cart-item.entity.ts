import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '@users/entities/user.entity';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';
import { CustomerGroup } from '@/modules/customer-groups/entities/customer-group.entity';

/**
 * GroupCartItem — one line in a group's shared cart. The group IS the cart (no
 * separate cart header). Mirrors the storefront ShopCartItem line semantics but
 * stores NO price/name/image: the server stays the price authority and resolves
 * the live product price on read and at checkout. A line is uniquely identified
 * by (group, product, branch, unit, by-amount); the service merges duplicate
 * adds rather than relying on a nullable-column unique index.
 */
@Entity('group_cart_items')
@Index('IDX_group_cart_items_customer_group_id', ['customerGroupId'])
export class GroupCartItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'customer_group_id' })
  customerGroupId!: string;

  @ManyToOne(() => CustomerGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_group_id' })
  group!: CustomerGroup;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  /** Chosen sellable unit; null = the product base unit. */
  @Column({ type: 'uuid', name: 'unit_id', nullable: true })
  unitId!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity!: number;

  /**
   * "Buy by amount": the firm cash a member named for a loose line (e.g. 1000 Rs
   * of bananas); null for normal by-weight / by-count lines. Mirrors
   * ShopCartItem.amount — the server reconciles it against quantity × price.
   */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount!: number | null;

  @Column({ type: 'uuid', name: 'added_by_user_id' })
  addedByUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'added_by_user_id' })
  addedByUser!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
