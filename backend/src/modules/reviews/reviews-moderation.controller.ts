import {
  Controller,
  Delete,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import { ReviewsService, type ReviewActor } from './reviews.service';
import { ModerationListQueryDto } from './dto/moderation-list-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { ModerationReviewView, PagedModerationReviews } from './types';

/**
 * Staff moderation for product reviews — soft-hide (excluded from the public
 * list + aggregate, row retained so the author can't re-post to evade) or hard
 * delete. ADMIN / MANAGER only.
 */
@Controller(APP_ROUTES.REVIEWS.ADMIN_BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class ReviewsModerationController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(
    @Query() query: ModerationListQueryDto,
  ): Promise<PagedModerationReviews> {
    return this.reviews.listForModeration(query);
  }

  @Patch(APP_ROUTES.REVIEWS.ADMIN_REVIEW_HIDE)
  hide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateReviewDto,
    @CurrentUser() actor: ReviewActor,
  ): Promise<ModerationReviewView> {
    return this.reviews.hide(id, actor, dto);
  }

  @Patch(APP_ROUTES.REVIEWS.ADMIN_REVIEW_UNHIDE)
  unhide(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: ReviewActor,
  ): Promise<ModerationReviewView> {
    return this.reviews.unhide(id, actor);
  }

  @Delete(APP_ROUTES.REVIEWS.ADMIN_REVIEW_BY_ID)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: true }> {
    await this.reviews.moderateDelete(id);
    return { deleted: true };
  }
}
