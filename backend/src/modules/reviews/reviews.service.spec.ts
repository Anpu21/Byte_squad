/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { ProductReviewStatus } from '@common/enums/product-review.enum';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';
import { ProductReview } from './entities/product-review.entity';
import { Product } from '@products/entities/product.entity';

const PRODUCT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';
const OTHER_USER = '33333333-3333-3333-3333-333333333333';
const REVIEW_ID = '44444444-4444-4444-4444-444444444444';
const ADMIN = { id: 'admin-1', role: UserRole.ADMIN, branchId: null };

function makeReview(overrides: Partial<ProductReview> = {}): ProductReview {
  return {
    id: REVIEW_ID,
    productId: PRODUCT_ID,
    userId: USER_ID,
    rating: 5,
    title: null,
    comment: 'Great quality',
    isVerifiedPurchase: true,
    status: ProductReviewStatus.VISIBLE,
    moderatedByUserId: null,
    moderatedAt: null,
    moderationReason: null,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    user: { firstName: 'Dinesh', lastName: 'Saarck' },
    product: { name: 'Basmati Rice' },
    ...overrides,
  } as ProductReview;
}

describe('ReviewsService', () => {
  let service: ReviewsService;
  let repo: jest.Mocked<ReviewsRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: ReviewsRepository,
          useValue: {
            findById: jest.fn(),
            findByIdWithRelations: jest.fn(),
            findByProductAndUser: jest.fn(),
            findActiveProduct: jest.fn(),
            listForProduct: jest.fn(),
            summaryForProduct: jest.fn(),
            listForModeration: jest.fn(),
            hasPurchased: jest.fn(),
            insertAndRecompute: jest.fn(),
            updateAndRecompute: jest.fn(),
            deleteAndRecompute: jest.fn(),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(ReviewsService);
    repo = moduleRef.get(ReviewsRepository);
  });

  describe('getProductReviews', () => {
    it('404s when the product is missing or inactive', async () => {
      repo.findActiveProduct.mockResolvedValue(null);
      await expect(
        service.getProductReviews(PRODUCT_ID, {}, USER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('folds the star distribution and computes the average', async () => {
      repo.findActiveProduct.mockResolvedValue({ id: PRODUCT_ID } as Product);
      repo.listForProduct.mockResolvedValue({ rows: [], total: 0 });
      repo.summaryForProduct.mockResolvedValue([
        { rating: 5, count: '2' },
        { rating: 4, count: '1' },
      ]);
      repo.findByProductAndUser.mockResolvedValue(null);
      repo.hasPurchased.mockResolvedValue(true);

      const result = await service.getProductReviews(PRODUCT_ID, {}, USER_ID);
      expect(result.summary.count).toBe(3);
      expect(result.summary.average).toBe(4.67);
      expect(result.summary.distribution).toEqual({
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 1,
        '5': 2,
      });
    });

    it('lets a verified buyer with no review post one', async () => {
      repo.findActiveProduct.mockResolvedValue({ id: PRODUCT_ID } as Product);
      repo.listForProduct.mockResolvedValue({ rows: [], total: 0 });
      repo.summaryForProduct.mockResolvedValue([]);
      repo.findByProductAndUser.mockResolvedValue(null);
      repo.hasPurchased.mockResolvedValue(true);

      const result = await service.getProductReviews(PRODUCT_ID, {}, USER_ID);
      expect(result.eligibility).toEqual({
        canReview: true,
        hasPurchased: true,
      });
      expect(result.myReview).toBeNull();
    });

    it('lets a non-buyer with no review post one', async () => {
      repo.findActiveProduct.mockResolvedValue({ id: PRODUCT_ID } as Product);
      repo.listForProduct.mockResolvedValue({ rows: [], total: 0 });
      repo.summaryForProduct.mockResolvedValue([]);
      repo.findByProductAndUser.mockResolvedValue(null);
      repo.hasPurchased.mockResolvedValue(false);

      const result = await service.getProductReviews(PRODUCT_ID, {}, USER_ID);
      expect(result.eligibility.canReview).toBe(true);
      expect(result.eligibility.hasPurchased).toBe(false);
    });

    it('returns the caller review as myReview and masks others', async () => {
      repo.findActiveProduct.mockResolvedValue({ id: PRODUCT_ID } as Product);
      repo.listForProduct.mockResolvedValue({
        rows: [
          makeReview({
            user: { firstName: 'Dinesh', lastName: 'Saarck' },
          } as Partial<ProductReview>),
        ],
        total: 1,
      });
      repo.summaryForProduct.mockResolvedValue([{ rating: 5, count: '1' }]);
      repo.findByProductAndUser.mockResolvedValue(makeReview());
      repo.hasPurchased.mockResolvedValue(true);

      const result = await service.getProductReviews(PRODUCT_ID, {}, USER_ID);
      expect(result.items[0].reviewerName).toBe('Dinesh S.');
      expect(result.myReview?.reviewerName).toBe('You');
      expect(result.eligibility.canReview).toBe(false);
    });
  });

  describe('create', () => {
    it('404s when the product is inactive', async () => {
      repo.findActiveProduct.mockResolvedValue(null);
      await expect(
        service.create(PRODUCT_ID, { rating: 5 }, USER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.insertAndRecompute).not.toHaveBeenCalled();
    });

    it('409s when the customer already reviewed the product', async () => {
      repo.findActiveProduct.mockResolvedValue({ id: PRODUCT_ID } as Product);
      repo.findByProductAndUser.mockResolvedValue(makeReview());
      await expect(
        service.create(PRODUCT_ID, { rating: 5 }, USER_ID),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lets a non-buyer post a review (stored as unverified)', async () => {
      repo.findActiveProduct.mockResolvedValue({ id: PRODUCT_ID } as Product);
      repo.findByProductAndUser.mockResolvedValue(null);
      repo.hasPurchased.mockResolvedValue(false);
      repo.insertAndRecompute.mockResolvedValue(
        makeReview({ isVerifiedPurchase: false }),
      );

      await service.create(PRODUCT_ID, { rating: 4 }, USER_ID);

      expect(repo.insertAndRecompute).toHaveBeenCalledWith(
        expect.objectContaining({ isVerifiedPurchase: false }),
      );
    });

    it('stores the verified flag and persists for a buyer', async () => {
      repo.findActiveProduct.mockResolvedValue({ id: PRODUCT_ID } as Product);
      repo.findByProductAndUser.mockResolvedValue(null);
      repo.hasPurchased.mockResolvedValue(true);
      repo.insertAndRecompute.mockResolvedValue(makeReview());
      await service.create(
        PRODUCT_ID,
        { rating: 5, comment: '  Great  ' },
        USER_ID,
      );
      expect(repo.insertAndRecompute).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: PRODUCT_ID,
          userId: USER_ID,
          rating: 5,
          comment: 'Great',
          isVerifiedPurchase: true,
          status: ProductReviewStatus.VISIBLE,
        }),
      );
    });

    it('maps a unique-violation race to 409', async () => {
      repo.findActiveProduct.mockResolvedValue({ id: PRODUCT_ID } as Product);
      repo.findByProductAndUser.mockResolvedValue(null);
      repo.hasPurchased.mockResolvedValue(true);
      repo.insertAndRecompute.mockRejectedValue(
        new QueryFailedError('insert', [], {
          code: '23505',
        } as unknown as Error),
      );
      await expect(
        service.create(PRODUCT_ID, { rating: 5 }, USER_ID),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    it('404s when the review is missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.update(REVIEW_ID, { rating: 3 }, USER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("403s when editing someone else's review", async () => {
      repo.findById.mockResolvedValue(makeReview({ userId: OTHER_USER }));
      await expect(
        service.update(REVIEW_ID, { rating: 3 }, USER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.updateAndRecompute).not.toHaveBeenCalled();
    });

    it('applies changed fields and recomputes', async () => {
      repo.findById.mockResolvedValue(makeReview());
      repo.updateAndRecompute.mockImplementation((r) => Promise.resolve(r));
      const result = await service.update(REVIEW_ID, { rating: 2 }, USER_ID);
      expect(repo.updateAndRecompute).toHaveBeenCalledWith(
        expect.objectContaining({ rating: 2 }),
      );
      expect(result.rating).toBe(2);
    });
  });

  describe('remove', () => {
    it("403s when deleting someone else's review", async () => {
      repo.findById.mockResolvedValue(makeReview({ userId: OTHER_USER }));
      await expect(service.remove(REVIEW_ID, USER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repo.deleteAndRecompute).not.toHaveBeenCalled();
    });

    it('deletes an owned review', async () => {
      const review = makeReview();
      repo.findById.mockResolvedValue(review);
      await service.remove(REVIEW_ID, USER_ID);
      expect(repo.deleteAndRecompute).toHaveBeenCalledWith(review);
    });
  });

  describe('moderation', () => {
    it('hides a review and records the moderator', async () => {
      repo.findByIdWithRelations.mockResolvedValue(makeReview());
      repo.updateAndRecompute.mockImplementation((r) => Promise.resolve(r));
      const view = await service.hide(REVIEW_ID, ADMIN, { reason: 'spam' });
      expect(repo.updateAndRecompute).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ProductReviewStatus.HIDDEN,
          moderatedByUserId: ADMIN.id,
          moderationReason: 'spam',
        }),
      );
      expect(view.status).toBe(ProductReviewStatus.HIDDEN);
      expect(view.productName).toBe('Basmati Rice');
    });

    it('unhides a review and clears the reason', async () => {
      repo.findByIdWithRelations.mockResolvedValue(
        makeReview({ status: ProductReviewStatus.HIDDEN }),
      );
      repo.updateAndRecompute.mockImplementation((r) => Promise.resolve(r));
      const view = await service.unhide(REVIEW_ID, ADMIN);
      expect(view.status).toBe(ProductReviewStatus.VISIBLE);
      expect(view.moderationReason).toBeNull();
    });

    it('hard-deletes via moderation', async () => {
      const review = makeReview();
      repo.findById.mockResolvedValue(review);
      await service.moderateDelete(REVIEW_ID);
      expect(repo.deleteAndRecompute).toHaveBeenCalledWith(review);
    });

    it('caps the moderation page size', async () => {
      repo.listForModeration.mockResolvedValue({ rows: [], total: 0 });
      await service.listForModeration({ limit: 999 });
      expect(repo.listForModeration).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }),
      );
    });
  });
});
