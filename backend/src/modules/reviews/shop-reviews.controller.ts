import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ReviewItemView, ReviewListView } from './types';

/**
 * Customer-facing reviews: read a product's reviews + aggregate, and
 * post/edit/delete your own. Only verified buyers may post (enforced in the
 * service). Mounted under the storefront, CUSTOMER role only.
 */
@Controller(APP_ROUTES.REVIEWS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class ShopReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get(APP_ROUTES.REVIEWS.PRODUCT_REVIEWS)
  list(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: ListReviewsQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<ReviewListView> {
    return this.reviews.getProductReviews(productId, query, userId);
  }

  @Post(APP_ROUTES.REVIEWS.PRODUCT_REVIEWS)
  create(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser('id') userId: string,
  ): Promise<ReviewItemView> {
    return this.reviews.create(productId, dto, userId);
  }

  @Patch(APP_ROUTES.REVIEWS.REVIEW_BY_ID)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser('id') userId: string,
  ): Promise<ReviewItemView> {
    return this.reviews.update(id, dto, userId);
  }

  @Delete(APP_ROUTES.REVIEWS.REVIEW_BY_ID)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ deleted: true }> {
    await this.reviews.remove(id, userId);
    return { deleted: true };
  }
}
