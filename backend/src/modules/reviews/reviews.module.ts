import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductReview } from './entities/product-review.entity';

/**
 * Product reviews & ratings. Customer surface (post/edit/delete own review,
 * read aggregates) + staff moderation. The repository is DataSource-injected,
 * but the entity is still registered via forFeature so `autoLoadEntities` picks
 * it up for schema sync. Controllers + providers are wired in Phase 2.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ProductReview])],
})
export class ReviewsModule {}
