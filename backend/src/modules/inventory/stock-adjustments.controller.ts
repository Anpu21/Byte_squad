import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StockAdjustmentsService } from '@inventory/stock-adjustments.service';
import { CreateStockAdjustmentDto } from '@inventory/dto/create-stock-adjustment.dto';
import { ListStockAdjustmentsQueryDto } from '@inventory/dto/list-stock-adjustments-query.dto';
import { StockAdjustment } from '@inventory/entities/stock-adjustment.entity';
import { PaginatedStockAdjustments } from '@inventory/types';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.STOCK_ADJUSTMENTS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockAdjustmentsController {
  constructor(private readonly service: StockAdjustmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateStockAdjustmentDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<StockAdjustment> {
    return this.service.create(dto, actor);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(
    @Query() query: ListStockAdjustmentsQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<PaginatedStockAdjustments> {
    return this.service.listForBranch(actor, query);
  }

  @Patch(APP_ROUTES.STOCK_ADJUSTMENTS.APPROVE)
  @Roles(UserRole.ADMIN)
  approve(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<StockAdjustment> {
    return this.service.approve(id, actor);
  }

  @Patch(APP_ROUTES.STOCK_ADJUSTMENTS.REVERSE)
  @Roles(UserRole.ADMIN)
  reverse(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<StockAdjustment> {
    return this.service.reverse(id, actor);
  }
}
