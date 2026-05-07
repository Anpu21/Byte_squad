import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ShopService, ShopProduct } from '@/modules/shop/shop.service';
import {
  ListShopProductsDto,
  ShopBranchScopedDto,
} from '@/modules/shop/dto/list-shop-products.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(`${APP_ROUTES.SHOP.BASE}/${APP_ROUTES.SHOP.PRODUCTS}`)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class ShopProductsController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  list(@Query() query: ListShopProductsDto): Promise<ShopProduct[]> {
    return this.shopService.listProducts({
      branchId: query.branchId,
      category: query.category,
      search: query.search,
    });
  }

  @Get('categories')
  getCategories(@Query() query: ShopBranchScopedDto): Promise<string[]> {
    return this.shopService.getCategories(query.branchId);
  }

  @Get(':id')
  getOne(
    @Param('id') id: string,
    @Query('branchId') branchId?: string,
  ): Promise<ShopProduct> {
    return this.shopService.getProduct(id, branchId);
  }
}
