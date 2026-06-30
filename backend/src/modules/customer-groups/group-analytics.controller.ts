import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GroupAnalyticsService } from '@/modules/customer-groups/group-analytics.service';
import { GroupAnalyticsQueryDto } from '@/modules/customer-groups/dto/group-analytics-query.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { APP_ROUTES } from '@common/routes/app.routes';
import type { GroupAnalyticsResponse } from '@/modules/customer-groups/types';

@Controller(APP_ROUTES.CUSTOMER_GROUPS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class GroupAnalyticsController {
  constructor(private readonly service: GroupAnalyticsService) {}

  @Get(APP_ROUTES.CUSTOMER_GROUPS.ANALYTICS)
  getAnalytics(
    @Param('id') id: string,
    @Query() query: GroupAnalyticsQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<GroupAnalyticsResponse> {
    return this.service.getAnalytics(id, query, actor);
  }
}
