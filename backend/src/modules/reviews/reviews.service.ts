import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { ProductReviewStatus } from '@common/enums/product-review.enum';
import { ProductReview } from './entities/product-review.entity';
import { ReviewsRepository, type RatingSummaryRow } from './reviews.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ModerationListQueryDto } from './dto/moderation-list-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import {
  ModerationReviewView,
  PagedModerationReviews,
  RatingDistribution,
  ReviewItemView,
  ReviewListView,
  ReviewSummaryView,
} from './types';

export interface ReviewActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

/**
 * Purchase gate for posting a review. `false` lets any signed-in customer review
 * any active product; `true` restricts posting to verified buyers.
 * `isVerifiedPurchase` is computed and stored on every review either way, so
 * flipping this is non-destructive — the value stays accurate in the DB.
 */
const REVIEW_REQUIRES_PURCHASE = false;

const LIST_DEFAULT_LIMIT = 10;
const LIST_MAX_LIMIT = 50;
const MODERATION_DEFAULT_LIMIT = 20;
const MODERATION_MAX_LIMIT = 100;

/**
 * Product reviews & ratings. Any signed-in customer posts/edits/deletes their
 * own review of an active product (one per product); the product's aggregate is
 * recomputed on every write (in the repository, transactionally). Staff moderate
 * via soft-hide or delete.
 */
@Injectable()
export class ReviewsService {
  constructor(private readonly reviews: ReviewsRepository) {}

  async getProductReviews(
    productId: string,
    query: ListReviewsQueryDto,
    userId: string,
  ): Promise<ReviewListView> {
    await this.assertActiveProduct(productId);
    const limit = Math.min(query.limit ?? LIST_DEFAULT_LIMIT, LIST_MAX_LIMIT);
    const offset = query.offset ?? 0;

    const [page, summaryRows, myReviewEntity, hasPurchased] = await Promise.all(
      [
        this.reviews.listForProduct({ productId, limit, offset }),
        this.reviews.summaryForProduct(productId),
        this.reviews.findByProductAndUser(productId, userId),
        this.reviews.hasPurchased(userId, productId),
      ],
    );

    const myReview = myReviewEntity ? this.toOwnView(myReviewEntity) : null;
    const canReview =
      myReview === null && (!REVIEW_REQUIRES_PURCHASE || hasPurchased);

    return {
      summary: this.foldSummary(summaryRows),
      items: page.rows.map((r) => this.toItemView(r)),
      total: page.total,
      myReview,
      eligibility: { canReview, hasPurchased },
    };
  }

  async create(
    productId: string,
    dto: CreateReviewDto,
    userId: string,
  ): Promise<ReviewItemView> {
    await this.assertActiveProduct(productId);

    const existing = await this.reviews.findByProductAndUser(productId, userId);
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    const hasPurchased = await this.reviews.hasPurchased(userId, productId);
    if (REVIEW_REQUIRES_PURCHASE && !hasPurchased) {
      throw new ForbiddenException(
        'Only verified buyers can review this product',
      );
    }

    try {
      const saved = await this.reviews.insertAndRecompute({
        productId,
        userId,
        rating: dto.rating,
        title: clean(dto.title),
        comment: clean(dto.comment),
        isVerifiedPurchase: hasPurchased,
        status: ProductReviewStatus.VISIBLE,
      });
      return this.toOwnView(saved);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException('You have already reviewed this product');
      }
      throw err;
    }
  }

  async update(
    reviewId: string,
    dto: UpdateReviewDto,
    userId: string,
  ): Promise<ReviewItemView> {
    const review = await this.getOwnedReview(reviewId, userId);
    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.title !== undefined) review.title = clean(dto.title);
    if (dto.comment !== undefined) review.comment = clean(dto.comment);
    const saved = await this.reviews.updateAndRecompute(review);
    return this.toOwnView(saved);
  }

  async remove(reviewId: string, userId: string): Promise<void> {
    const review = await this.getOwnedReview(reviewId, userId);
    await this.reviews.deleteAndRecompute(review);
  }

  // ── Moderation (ADMIN / MANAGER) ─────────────────────────────────────────

  async listForModeration(
    query: ModerationListQueryDto,
  ): Promise<PagedModerationReviews> {
    const limit = Math.min(
      query.limit ?? MODERATION_DEFAULT_LIMIT,
      MODERATION_MAX_LIMIT,
    );
    const offset = query.offset ?? 0;
    const { rows, total } = await this.reviews.listForModeration({
      productId: query.productId,
      status: query.status,
      limit,
      offset,
    });
    return { rows: rows.map((r) => this.toModerationView(r)), total };
  }

  hide(
    reviewId: string,
    actor: ReviewActor,
    dto: ModerateReviewDto,
  ): Promise<ModerationReviewView> {
    return this.moderate(
      reviewId,
      actor,
      ProductReviewStatus.HIDDEN,
      dto.reason,
    );
  }

  unhide(reviewId: string, actor: ReviewActor): Promise<ModerationReviewView> {
    return this.moderate(
      reviewId,
      actor,
      ProductReviewStatus.VISIBLE,
      undefined,
    );
  }

  async moderateDelete(reviewId: string): Promise<void> {
    const review = await this.reviews.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    await this.reviews.deleteAndRecompute(review);
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private async moderate(
    reviewId: string,
    actor: ReviewActor,
    status: ProductReviewStatus,
    reason: string | undefined,
  ): Promise<ModerationReviewView> {
    const review = await this.reviews.findByIdWithRelations(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    review.status = status;
    review.moderatedByUserId = actor.id;
    review.moderatedAt = new Date();
    review.moderationReason =
      status === ProductReviewStatus.HIDDEN ? clean(reason) : null;
    const saved = await this.reviews.updateAndRecompute(review);
    return this.toModerationView(saved);
  }

  private async assertActiveProduct(productId: string): Promise<void> {
    const product = await this.reviews.findActiveProduct(productId);
    if (!product) throw new NotFoundException('Product not found');
  }

  private async getOwnedReview(
    reviewId: string,
    userId: string,
  ): Promise<ProductReview> {
    const review = await this.reviews.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only manage your own review');
    }
    return review;
  }

  private foldSummary(rows: RatingSummaryRow[]): ReviewSummaryView {
    const distribution: RatingDistribution = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };
    let count = 0;
    let weighted = 0;
    for (const row of rows) {
      const rating = Number(row.rating);
      const n = Number(row.count);
      if (rating >= 1 && rating <= 5) {
        distribution[String(rating) as keyof RatingDistribution] = n;
        count += n;
        weighted += rating * n;
      }
    }
    const average = count > 0 ? Math.round((weighted / count) * 100) / 100 : 0;
    return { average, count, distribution };
  }

  private toItemView(r: ProductReview): ReviewItemView {
    return {
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      reviewerName: maskName(r.user?.firstName, r.user?.lastName),
      createdAt: toIso(r.createdAt),
      updatedAt: toIso(r.updatedAt),
    };
  }

  private toOwnView(r: ProductReview): ReviewItemView {
    return {
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      reviewerName: 'You',
      createdAt: toIso(r.createdAt),
      updatedAt: toIso(r.updatedAt),
    };
  }

  private toModerationView(r: ProductReview): ModerationReviewView {
    return {
      id: r.id,
      productId: r.productId,
      productName: r.product?.name ?? '—',
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      status: r.status,
      isVerifiedPurchase: r.isVerifiedPurchase,
      reviewerName: fullName(r.user?.firstName, r.user?.lastName),
      createdAt: toIso(r.createdAt),
      moderatedAt: r.moderatedAt ? toIso(r.moderatedAt) : null,
      moderationReason: r.moderationReason,
    };
  }
}

function clean(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Public display name: first name + last initial (never the email). */
function maskName(firstName?: string | null, lastName?: string | null): string {
  const first = (firstName ?? '').trim();
  const last = (lastName ?? '').trim();
  if (!first && !last) return 'Customer';
  if (!last) return first;
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

function fullName(firstName?: string | null, lastName?: string | null): string {
  const name = `${(firstName ?? '').trim()} ${(lastName ?? '').trim()}`.trim();
  return name || 'Customer';
}

function toIso(value: Date): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function isUniqueViolation(err: unknown): boolean {
  if (!(err instanceof QueryFailedError)) return false;
  const code = (err.driverError as { code?: string } | undefined)?.code;
  return code === '23505';
}
