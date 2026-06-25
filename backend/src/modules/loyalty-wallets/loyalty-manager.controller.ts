import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import { LoyaltyService } from '@/modules/loyalty-wallets/loyalty.service';
import { ListLoyaltyCustomersQueryDto } from '@/modules/loyalty-customers/dto/list-loyalty-customers-query.dto';
import { ListLoyaltyHistoryQueryDto } from '@/modules/loyalty-wallets/dto/list-loyalty-history-query.dto';
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

  @Get(APP_ROUTES.LOYALTY.MANAGER_CUSTOMER_HISTORY)
  customerHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: ListLoyaltyHistoryQueryDto,
  ) {
    return this.loyalty.listHistory(userId, query);
  }

  @Get(APP_ROUTES.LOYALTY.MANAGER_DASHBOARD)
  dashboard(@CurrentUser('branchId') branchId: string) {
    return this.loyalty.getDashboardStats(branchId);
  }
}
