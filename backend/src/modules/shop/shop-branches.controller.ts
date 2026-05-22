import { Controller, Get, UseGuards } from '@nestjs/common';
import { ShopService, ShopBranch } from '@/modules/shop/shop.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(`${APP_ROUTES.SHOP.BASE}/${APP_ROUTES.SHOP.BRANCHES}`)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class ShopBranchesController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  list(): Promise<ShopBranch[]> {
    return this.shopService.listActiveBranches();
  }
}
