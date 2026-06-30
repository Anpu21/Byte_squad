import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { User } from '@users/entities/user.entity';
import { ProductReviewStatus } from '@common/enums/product-review.enum';

/**
 * A customer's 1–5★ rating + optional written review of a product. Exactly one
 * row per (product, customer) — editing replaces it, it never duplicates
 * (enforced by the unique index). Only verified buyers may create one (gated in
 * ReviewsService); `isVerifiedPurchase` snapshots that at write time. Staff
 * moderation soft-hides a row (`status='hidden'`) so it drops out of the public
 * list + aggregate while the unique key still blocks the author from re-posting
 * to evade a takedown.
 */
@Entity('product_reviews')
@Index(['productId', 'userId'], { unique: true })
@Index(['productId', 'createdAt'])
@Index(['userId'])
@Check(`"rating" BETWEEN 1 AND 5`)
export class ProductReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  /** 1–5 inclusive (CHECK constraint, mirrored in the migration). */
  @Column({ type: 'smallint' })
  rating!: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  title!: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  comment!: string | null;

  @Column({ type: 'boolean', name: 'is_verified_purchase', default: true })
  isVerifiedPurchase!: boolean;

  @Column({ type: 'varchar', length: 16, default: ProductReviewStatus.VISIBLE })
  status!: ProductReviewStatus;

  @Column({ type: 'uuid', name: 'moderated_by_user_id', nullable: true })
  moderatedByUserId!: string | null;

  @Column({ type: 'timestamp', name: 'moderated_at', nullable: true })
  moderatedAt!: Date | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'moderation_reason',
    nullable: true,
  })
  moderationReason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
