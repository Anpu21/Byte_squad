import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductReview } from './entities/product-review.entity';
import { ReviewsRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';
import { ShopReviewsController } from './shop-reviews.controller';
import { ReviewsModerationController } from './reviews-moderation.controller';

/**
 * Product reviews & ratings. Customer surface (post/edit/delete own review,
 * read aggregates) + staff moderation. The repository is DataSource-injected,
 * but the entity is still registered via forFeature so `autoLoadEntities` picks
 * it up for schema sync.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ProductReview])],
  controllers: [ShopReviewsController, ReviewsModerationController],
  providers: [ReviewsService, ReviewsRepository],
})
export class ReviewsModule {}
