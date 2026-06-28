import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import { ReorderSuggestionsService } from '@/modules/purchases/reorder-suggestions.service';
import { ReorderSuggestionsQueryDto } from '@/modules/purchases/dto/reorder-suggestions-query.dto';
import { DraftPurchaseOrdersDto } from '@/modules/purchases/dto/draft-purchase-orders.dto';
import { PurchaseOrder } from '@/modules/purchases/entities/purchase-order.entity';
import type { PurchasesActor } from '@/modules/purchases/types/purchases-actor.type';
import type { ReorderSuggestionsReport } from '@/modules/purchases/types/reorder-suggestion.type';

@Controller(APP_ROUTES.PURCHASES.REORDER.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReorderSuggestionsController {
  constructor(private readonly reorder: ReorderSuggestionsService) {}

  /** Per-supplier reorder suggestions for the branch (managers pinned). */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  suggest(
    @Query() query: ReorderSuggestionsQueryDto,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<ReorderSuggestionsReport> {
    return this.reorder.suggest(query, actor);
  }

  /** Turn approved suggestions into Draft purchase orders (one per supplier). */
  @Post(APP_ROUTES.PURCHASES.REORDER.DRAFT)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  draft(
    @Body() dto: DraftPurchaseOrdersDto,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<PurchaseOrder[]> {
    return this.reorder.draft(dto, actor);
  }
}
