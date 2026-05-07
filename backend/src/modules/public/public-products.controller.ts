import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicService, PublicProduct } from '@/modules/public/public.service';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(`${APP_ROUTES.PUBLIC.BASE}/${APP_ROUTES.PUBLIC.PRODUCTS}`)
export class PublicProductsController {
  constructor(private readonly publicService: PublicService) {}

  @Get()
  list(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ): Promise<PublicProduct[]> {
    return this.publicService.listProducts({ category, search });
  }

  @Get('categories')
  getCategories(): Promise<string[]> {
    return this.publicService.getCategories();
  }

  @Get(':id')
  getOne(@Param('id') id: string): Promise<PublicProduct> {
    return this.publicService.getProduct(id);
  }
}
