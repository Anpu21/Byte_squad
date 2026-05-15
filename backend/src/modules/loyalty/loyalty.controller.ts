import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';
import { ListLoyaltyHistoryQueryDto } from '@/modules/loyalty/dto/list-loyalty-history-query.dto';

@Controller(APP_ROUTES.LOYALTY.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get(APP_ROUTES.LOYALTY.SETTINGS)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  getSettings() {
    return this.loyalty.getSettings();
  }

  @Get(APP_ROUTES.LOYALTY.MINE)
  @Roles(UserRole.CUSTOMER)
  getMine(@CurrentUser('id') userId: string) {
    return this.loyalty.getSummary(userId);
  }

  @Get(APP_ROUTES.LOYALTY.HISTORY)
  @Roles(UserRole.CUSTOMER)
  listHistory(
    @CurrentUser('id') userId: string,
    @Query() query: ListLoyaltyHistoryQueryDto,
  ) {
    return this.loyalty.listHistory(userId, query);
  }
}
