import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from '@/modules/customers/customers.service';
import { ListCustomersQueryDto } from '@/modules/customers/dto/list-customers-query.dto';
import type {
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

  // Composed 360 profile for one stitched customer (`key` = normalized phone or
  // `u:/lc:/ca:<id>`). Managers only reach customers with a record in their branch.
  @Get(APP_ROUTES.CUSTOMERS.BY_KEY)
  getOne(
    @Param('key') key: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<CustomerProfileDetail> {
    return this.service.getProfile(key, actor);
  }
}
