import { Injectable } from '@nestjs/common';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { ProductReviewStatus } from '@common/enums/product-review.enum';
import { ProductReview } from './entities/product-review.entity';

export interface ListReviewsForProductOptions {
  productId: string;
  limit: number;
  offset: number;
}

export interface ListModerationOptions {
  productId?: string;
  status?: ProductReviewStatus;
  limit: number;
  offset: number;
}

export interface RatingSummaryRow {
  rating: number;
  count: string;
}

interface VerifiedPurchaseRow {
  verified: boolean;
}

/**
 * Product-reviews data access (Rules.md §7 — DataSource-injected, no
 * @InjectRepository). Writes that change the visible set recompute the product
 * aggregate inside the same transaction (see {@link recomputeAggregates}).
 */
@Injectable()
export class ReviewsRepository {
  private readonly reviews: Repository<ProductReview>;
  private readonly products: Repository<Product>;

  constructor(private readonly dataSource: DataSource) {
    this.reviews = dataSource.getRepository(ProductReview);
    this.products = dataSource.getRepository(Product);
  }

  findById(id: string): Promise<ProductReview | null> {
    return this.reviews.findOne({ where: { id } });
  }

  findByIdWithRelations(id: string): Promise<ProductReview | null> {
    return this.reviews.findOne({
      where: { id },
      relations: ['user', 'product'],
    });
  }

  findByProductAndUser(
    productId: string,
    userId: string,
  ): Promise<ProductReview | null> {
    return this.reviews.findOne({ where: { productId, userId } });
  }

  findActiveProduct(productId: string): Promise<Product | null> {
    return this.products.findOne({ where: { id: productId, isActive: true } });
  }

  async listForProduct(
    opts: ListReviewsForProductOptions,
  ): Promise<{ rows: ProductReview[]; total: number }> {
    const [rows, total] = await this.reviews.findAndCount({
      where: { productId: opts.productId, status: ProductReviewStatus.VISIBLE },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: opts.limit,
      skip: opts.offset,
    });
    return { rows, total };
  }

  summaryForProduct(productId: string): Promise<RatingSummaryRow[]> {
    return this.reviews
      .createQueryBuilder('r')
      .select('r.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('r.product_id = :productId', { productId })
      .andWhere('r.status = :status', { status: ProductReviewStatus.VISIBLE })
      .groupBy('r.rating')
      .getRawMany<RatingSummaryRow>();
  }

  async listForModeration(
    opts: ListModerationOptions,
  ): Promise<{ rows: ProductReview[]; total: number }> {
    const where: FindOptionsWhere<ProductReview> = {};
    if (opts.productId) where.productId = opts.productId;
    if (opts.status) where.status = opts.status;
    const [rows, total] = await this.reviews.findAndCount({
      where,
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
      take: opts.limit,
      skip: opts.offset,
    });
    return { rows, total };
  }

  /**
   * True if the customer bought this product — via a completed pickup order or
   * an in-store sale booked under their account. One EXISTS-OR-EXISTS pass.
   */
  async hasPurchased(userId: string, productId: string): Promise<boolean> {
    const rows = await this.dataSource.query<VerifiedPurchaseRow[]>(
      `SELECT (
        EXISTS (
          SELECT 1 FROM customer_orders co
          JOIN customer_order_items coi ON coi.order_id = co.id
          WHERE co.user_id = $1 AND coi.product_id = $2
            AND co.status = 'completed'
        )
        OR EXISTS (
          SELECT 1 FROM sales s
          JOIN sale_items si ON si.sale_id = s.id
          WHERE s.customer_user_id = $1 AND si.product_id = $2
            AND s.status = 'Active' AND si.status = 'Active'
        )
      ) AS verified`,
      [userId, productId],
    );
    return rows[0]?.verified === true;
  }

  async insertAndRecompute(
    partial: DeepPartial<ProductReview>,
  ): Promise<ProductReview> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(ProductReview);
      const saved = await repo.save(repo.create(partial));
      await this.recomputeAggregates(saved.productId, manager);
      return saved;
    });
  }

  async updateAndRecompute(review: ProductReview): Promise<ProductReview> {
    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.getRepository(ProductReview).save(review);
      await this.recomputeAggregates(saved.productId, manager);
      return saved;
    });
  }

  async deleteAndRecompute(review: ProductReview): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(ProductReview).delete(review.id);
      await this.recomputeAggregates(review.productId, manager);
    });
  }

  /**
   * Recompute the denormalized product aggregates from the visible reviews,
   * inside the caller's transaction. The product row is locked first so
   * concurrent review writes serialize and converge — each recomputes from
   * scratch, so there is no increment drift.
   */
  private async recomputeAggregates(
    productId: string,
    manager: EntityManager,
  ): Promise<void> {
    await manager.query(`SELECT id FROM products WHERE id = $1 FOR UPDATE`, [
      productId,
    ]);
    await manager.query(
      `UPDATE products SET
         review_count = (
           SELECT COUNT(*) FROM product_reviews r
           WHERE r.product_id = $1 AND r.status = 'visible'
         ),
         avg_rating = (
           SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0)
           FROM product_reviews r
           WHERE r.product_id = $1 AND r.status = 'visible'
         )
       WHERE id = $1`,
      [productId],
    );
  }
}
