import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@products/entities/product.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { User } from '@users/entities/user.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { ShopService } from '@/modules/shop/shop.service';
import { ShopProductsController } from '@/modules/shop/shop-products.controller';
import { ShopBranchesController } from '@/modules/shop/shop-branches.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductSellableUnit,
      Branch,
      Inventory,
      User,
      SaleItem,
    ]),
  ],
  controllers: [ShopProductsController, ShopBranchesController],
  providers: [ShopService],
})
export class ShopModule {}
