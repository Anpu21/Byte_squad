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
import { CustomersService } from '@/modules/customers/customers.service';
import { ListCustomersQueryDto } from '@/modules/customers/dto/list-customers-query.dto';
import { UpdateCustomerProfileDto } from '@/modules/customers/dto/update-customer-profile.dto';
import { CustomerAnalyticsQueryDto } from '@/modules/customers/dto/customer-analytics-query.dto';
import { MergeCustomerDto } from '@/modules/customers/dto/merge-customer.dto';
import type {
  CustomerAnalytics,
  CustomerProfileDetail,
  CustomerSummary,
} from '@/modules/customers/types';
import type { IPaginated } from '@common/pagination/paginated.type';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.CUSTOMERS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  // Unified customers directory. Admins see all branches; managers are pinned to
  // their own by the service.
  @Get()
  list(
    @Query() query: ListCustomersQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<IPaginated<CustomerSummary>> {
    return this.service.list(query, actor);
  }

  // Cross-customer analytics (RFM / churn / LTV). MUST be declared before the
  // `:key` route so 'analytics' isn't swallowed as a customer key.
  @Get(APP_ROUTES.CUSTOMERS.ANALYTICS)
  analytics(
    @Query() query: CustomerAnalyticsQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CustomerAnalytics> {
    return this.service.getAnalytics(actor, query.branchId);
  }

  // Composed 360 profile for one stitched customer (`key` = normalized phone or
  // `u:/lc:/ca:<id>`). Managers only reach customers with a record in their branch.
  @Get(APP_ROUTES.CUSTOMERS.BY_KEY)
  getOne(
    @Param('key') key: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<CustomerProfileDetail> {
    return this.service.getProfile(key, actor);
  }

  // Update management metadata (tags / notes / segment / status = deactivate).
  @Patch(APP_ROUTES.CUSTOMERS.BY_KEY)
  update(
    @Param('key') key: string,
    @Body() dto: UpdateCustomerProfileDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CustomerProfileDetail> {
    return this.service.updateProfile(key, dto, actor);
  }

  // Full-reassign merge of a walk-in/khata customer into a registered user.
  @Post(APP_ROUTES.CUSTOMERS.MERGE)
  merge(
    @Param('key') key: string,
    @Body() dto: MergeCustomerDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CustomerProfileDetail> {
    return this.service.merge(key, dto.targetKey, actor);
  }
}
