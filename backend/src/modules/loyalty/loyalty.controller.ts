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
import type { AuthUser } from '@common/types/auth-user.type';
import {
  LoyaltyService,
  type LoyaltyCustomersResponse,
} from '@/modules/loyalty/loyalty.service';
import { ListLoyaltyCustomersQueryDto } from '@/modules/loyalty/dto/list-loyalty-customers-query.dto';
import { ListLoyaltyHistoryQueryDto } from '@/modules/loyalty/dto/list-loyalty-history-query.dto';
import { LookupLoyaltyByPhoneQueryDto } from '@/modules/loyalty/dto/lookup-loyalty-by-phone-query.dto';
import { EnrollWalkInCustomerDto } from '@/modules/loyalty/dto/enroll-walk-in-customer.dto';
import { UpdateWalkInCustomerDto } from '@/modules/loyalty/dto/update-walk-in-customer.dto';
import type {
  LoyaltyHistoryResponse,
  LoyaltyLookupResult,
} from '@/modules/loyalty/types';

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
  enroll(
    @Body() body: EnrollWalkInCustomerDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<LoyaltyLookupResult> {
    return this.loyalty.enrollWalkInCustomer(body, actor);
  }

  /**
   * Edit a walk-in member's name/phone (customer-hub management action).
   * Manager/admin only; the service branch-scopes non-admins.
   */
  @Patch(APP_ROUTES.LOYALTY.CUSTOMER_BY_ID)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  updateWalkIn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateWalkInCustomerDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<LoyaltyLookupResult> {
    return this.loyalty.updateWalkInCustomer(id, body, actor);
  }

  /**
   * Branch-scoped loyalty member list for the cashier store-credit-style
   * browse page. `listBranchCustomers` pins non-admins to their own branch.
   */
  @Get(APP_ROUTES.LOYALTY.CUSTOMERS)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  listBranchCustomers(
    @Query() query: ListLoyaltyCustomersQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<LoyaltyCustomersResponse> {
    return this.loyalty.listBranchCustomers(query, actor);
  }

  /**
   * Points ledger for one member (by loyalty account id — walk-ins have no
   * userId). Branch access is enforced in the service so a cashier only
   * reads their own branch's members.
   */
  @Get(APP_ROUTES.LOYALTY.CUSTOMER_HISTORY)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  memberHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListLoyaltyHistoryQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<LoyaltyHistoryResponse> {
    return this.loyalty.getMemberHistory(id, actor, query);
  }
}
