import { Module } from '@nestjs/common';
import { ShopService } from '@/modules/shop/shop.service';
import { ShopReadRepository } from '@/modules/shop/shop-read.repository';
import { ShopProductsController } from '@/modules/shop/shop-products.controller';
import { ShopBranchesController } from '@/modules/shop/shop-branches.controller';

@Module({
  // No TypeOrmModule.forFeature: data access lives in ShopReadRepository, which
  // is DataSource-injected (entities are registered by their owning modules).
  controllers: [ShopProductsController, ShopBranchesController],
  providers: [ShopService, ShopReadRepository],
})
export class ShopModule {}
