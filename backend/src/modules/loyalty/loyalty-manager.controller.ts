import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';
import { ListLoyaltyCustomersQueryDto } from '@/modules/loyalty/dto/list-loyalty-customers-query.dto';
import { AdjustLoyaltyPointsDto } from '@/modules/loyalty/dto/adjust-loyalty-points.dto';
import type { AuthUser } from '@common/types/auth-user.type';

@Controller(APP_ROUTES.LOYALTY.MANAGER_BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER)
export class LoyaltyManagerController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get(APP_ROUTES.LOYALTY.MANAGER_CUSTOMERS)
  listCustomers(
    @CurrentUser() user: AuthUser,
    @Query() query: ListLoyaltyCustomersQueryDto,
  ) {
    if (!user.branchId) {
      throw new BadRequestException('Manager must be assigned to a branch');
    }
    return this.loyalty.listCustomers({
      ...query,
      branchId: user.branchId,
    });
  }

  /** Branch-guarded manual adjustment (membership enforced in the service). */
  @Post(APP_ROUTES.LOYALTY.MANAGER_ADJUST)
  adjustPoints(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustLoyaltyPointsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.loyalty.adjustPoints(id, dto, actor);
  }

  @Get(APP_ROUTES.LOYALTY.MANAGER_DASHBOARD)
  dashboard(@CurrentUser('branchId') branchId: string) {
    return this.loyalty.getDashboardStats(branchId);
  }
}
