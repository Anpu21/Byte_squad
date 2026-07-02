import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from '@/modules/brands/entities/brand.entity';
import { Product } from '@products/entities/product.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { BrandRepository } from '@/modules/brands/brands.repository';
import { BrandsService } from '@/modules/brands/brands.service';
import { BrandsController } from '@/modules/brands/brands.controller';
import { CategoriesModule } from '@/modules/categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, Product, Sale, SaleItem]),
    // Exports CategoryRepository — used to validate categories in the
    // category → brands comparison endpoints.
    CategoriesModule,
  ],
  controllers: [BrandsController],
  providers: [BrandRepository, BrandsService],
  exports: [BrandRepository, BrandsService],
})
export class BrandsModule {}
