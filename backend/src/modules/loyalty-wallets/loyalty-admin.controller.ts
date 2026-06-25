import {
  Body,
  Controller,
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
import { LoyaltyService } from '@/modules/loyalty-wallets/loyalty.service';
import { LoyaltySettingsService } from '@/modules/loyalty-settings/loyalty-settings.service';
import { UpdateLoyaltySettingsDto } from '@/modules/loyalty-settings/dto/update-loyalty-settings.dto';
import { ListLoyaltyCustomersQueryDto } from '@/modules/loyalty-customers/dto/list-loyalty-customers-query.dto';
import { ListLoyaltyHistoryQueryDto } from '@/modules/loyalty-wallets/dto/list-loyalty-history-query.dto';
import { AdjustLoyaltyPointsDto } from '@/modules/loyalty-wallets/dto/adjust-loyalty-points.dto';

@Controller(APP_ROUTES.LOYALTY.ADMIN_BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class LoyaltyAdminController {
  constructor(
    private readonly loyalty: LoyaltyService,
    private readonly settings: LoyaltySettingsService,
  ) {}

  @Get(APP_ROUTES.LOYALTY.ADMIN_SETTINGS)
  getSettings() {
    return this.loyalty.getSettings();
  }

  @Patch(APP_ROUTES.LOYALTY.ADMIN_SETTINGS)
  updateSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLoyaltySettingsDto,
  ) {
    return this.settings.update(dto, userId);
  }

  @Get(APP_ROUTES.LOYALTY.ADMIN_CUSTOMERS)
  listCustomers(@Query() query: ListLoyaltyCustomersQueryDto) {
    return this.loyalty.listCustomers(query);
  }

  @Get(APP_ROUTES.LOYALTY.ADMIN_CUSTOMER_HISTORY)
  customerHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: ListLoyaltyHistoryQueryDto,
  ) {
    return this.loyalty.listHistory(userId, query);
  }

  @Get(APP_ROUTES.LOYALTY.ADMIN_DASHBOARD)
  dashboard() {
    return this.loyalty.getDashboardStats();
  }

  @Post(APP_ROUTES.LOYALTY.ADMIN_ADJUST)
  adjustPoints(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AdjustLoyaltyPointsDto,
  ) {
    return this.loyalty.adjustPoints(userId, dto);
  }
}
