import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';

@Controller(APP_ROUTES.LOYALTY.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get(APP_ROUTES.LOYALTY.MINE)
  getMine(@CurrentUser('id') userId: string) {
    return this.loyalty.getSummary(userId);
  }
}
