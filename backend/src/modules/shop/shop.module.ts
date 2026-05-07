import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { ShopService } from '@/modules/shop/shop.service';
import { ShopProductsController } from '@/modules/shop/shop-products.controller';
import { ShopBranchesController } from '@/modules/shop/shop-branches.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Branch, Inventory])],
  controllers: [ShopProductsController, ShopBranchesController],
  providers: [ShopService],
})
export class ShopModule {}
