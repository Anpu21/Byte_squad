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
import { CreditAccountsService } from '@/modules/credit-accounts/credit-accounts.service';
import { CreateCreditAccountRequestDto } from '@/modules/credit-accounts/dto/create-credit-account-request.dto';
import { ApproveCreditAccountDto } from '@/modules/credit-accounts/dto/approve-credit-account.dto';
import { RejectCreditAccountDto } from '@/modules/credit-accounts/dto/reject-credit-account.dto';
import { UpdateCreditAccountDto } from '@/modules/credit-accounts/dto/update-credit-account.dto';
import { ListCreditAccountsQueryDto } from '@/modules/credit-accounts/dto/list-credit-accounts-query.dto';
import { SearchCreditAccountsQueryDto } from '@/modules/credit-accounts/dto/search-credit-accounts-query.dto';
import { CreditAccount } from '@/modules/credit-accounts/entities/credit-account.entity';
import { ReceiveCreditAccountPaymentDto } from '@/modules/credit-accounts/dto/receive-credit-account-payment.dto';
import { AuthorizeOverrideDto } from '@/modules/credit-accounts/dto/authorize-override.dto';
import type {
  CreditAccountSearchResult,
  CreditAccountRow,
  CreditAccountStatement,
  CreditOverrideAuthorization,
} from '@/modules/credit-accounts/types';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.CREDIT_ACCOUNTS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreditAccountsController {
  constructor(private readonly service: CreditAccountsService) {}

  // Cashiers enroll a walk-in customer (the "special form"); managers approve.
  @Post()
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  request(
    @Body() dto: CreateCreditAccountRequestDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreditAccount> {
    return this.service.request(dto, actor);
  }

  // Step-up: a manager authorizes an over-limit credit charge at the counter.
  @Post(APP_ROUTES.CREDIT_ACCOUNTS.AUTHORIZE_OVERRIDE)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  authorizeOverride(
    @Body() dto: AuthorizeOverrideDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreditOverrideAuthorization> {
    return this.service.authorizeOverride(dto, actor);
  }

  // `search` is declared before `:id` so the literal path isn't param-captured.
  @Get(APP_ROUTES.CREDIT_ACCOUNTS.SEARCH)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  search(
    @Query() query: SearchCreditAccountsQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreditAccountSearchResult[]> {
    return this.service.search(query, actor);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  list(
    @Query() query: ListCreditAccountsQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreditAccountRow[]> {
    return this.service.list(query, actor);
  }

  @Get(APP_ROUTES.CREDIT_ACCOUNTS.STATEMENT)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  statement(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreditAccountStatement> {
    return this.service.getStatement(id, actor);
  }

  @Get(APP_ROUTES.CREDIT_ACCOUNTS.BY_ID)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  getOne(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreditAccount> {
    return this.service.getById(id, actor);
  }

  @Patch(APP_ROUTES.CREDIT_ACCOUNTS.APPROVE)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveCreditAccountDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreditAccount> {
    return this.service.approve(id, dto, actor);
  }

  @Patch(APP_ROUTES.CREDIT_ACCOUNTS.REJECT)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectCreditAccountDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreditAccount> {
    return this.service.reject(id, dto, actor);
  }

  @Patch(APP_ROUTES.CREDIT_ACCOUNTS.SUSPEND)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  suspend(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreditAccount> {
    return this.service.suspend(id, actor);
  }

  @Patch(APP_ROUTES.CREDIT_ACCOUNTS.CLOSE)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  close(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreditAccount> {
    return this.service.close(id, actor);
  }

  // Cashiers can settle at the counter; managers/admins too (branch-scoped).
  @Post(APP_ROUTES.CREDIT_ACCOUNTS.PAYMENTS)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  receivePayment(
    @Param('id') id: string,
    @Body() dto: ReceiveCreditAccountPaymentDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreditAccountStatement> {
    return this.service.receivePayment(id, dto, actor);
  }

  // `:id` (bare PATCH) is declared last so the action sub-paths win.
  @Patch(APP_ROUTES.CREDIT_ACCOUNTS.BY_ID)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCreditAccountDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreditAccount> {
    return this.service.update(id, dto, actor);
  }
}
