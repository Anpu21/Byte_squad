import {
  Body,
  Controller,
  Get,
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
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';
import { LoyaltySettingsService } from '@/modules/loyalty/loyalty-settings.service';
import { UpdateLoyaltySettingsDto } from '@/modules/loyalty/dto/update-loyalty-settings.dto';
import { ListLoyaltyCustomersQueryDto } from '@/modules/loyalty/dto/list-loyalty-customers-query.dto';
import { ListLoyaltyHistoryQueryDto } from '@/modules/loyalty/dto/list-loyalty-history-query.dto';

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
}
