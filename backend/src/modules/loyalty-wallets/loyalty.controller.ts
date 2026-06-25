import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import { LoyaltyService } from '@/modules/loyalty-wallets/loyalty.service';
import { ListLoyaltyHistoryQueryDto } from '@/modules/loyalty-wallets/dto/list-loyalty-history-query.dto';
import { LookupLoyaltyByPhoneQueryDto } from '@/modules/loyalty-customers/dto/lookup-loyalty-by-phone-query.dto';
import { EnrollWalkInCustomerDto } from '@/modules/loyalty-customers/dto/enroll-walk-in-customer.dto';
import type { LoyaltyLookupResult } from '@/modules/loyalty-wallets/types';

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

  /**
   * POS cashier phone lookup. Returns the wallet for either an
   * online customer or a walk-in record (whichever owns the
   * phone). 404s when the phone has no loyalty side at all so the
   * UI can fall through to the enroll prompt.
   */
  @Get(APP_ROUTES.LOYALTY.LOOKUP)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  lookup(
    @Query() query: LookupLoyaltyByPhoneQueryDto,
  ): Promise<LoyaltyLookupResult> {
    return this.loyalty.lookupByPhone(query.phone);
  }

  /**
   * POS cashier walk-in enrollment. Creates a LoyaltyCustomer +
   * wallet in one step. Rejects when the phone already has any
   * loyalty side, so the cashier UI must call `lookup` first.
   */
  @Post(APP_ROUTES.LOYALTY.ENROLL)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  enroll(@Body() body: EnrollWalkInCustomerDto): Promise<LoyaltyLookupResult> {
    return this.loyalty.enrollWalkInCustomer(body);
  }
}
