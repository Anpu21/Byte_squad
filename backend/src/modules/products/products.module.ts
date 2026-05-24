import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from '@products/products.service';
import { ProductsController } from '@products/products.controller';
import { ProductsRepository } from '@products/products.repository';
import { Product } from '@products/entities/product.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductSellableUnit])],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
