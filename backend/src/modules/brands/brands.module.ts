import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from '@/modules/brands/entities/brand.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Product } from '@products/entities/product.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { BrandRepository } from '@/modules/brands/brands.repository';
import { BrandBranchRepository } from '@/modules/brands/brand-branch.repository';
import { BrandsService } from '@/modules/brands/brands.service';
import { BrandBranchService } from '@/modules/brands/brand-branch.service';
import { BrandsController } from '@/modules/brands/brands.controller';
import { CategoriesModule } from '@/modules/categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, Branch, Product, Sale, SaleItem]),
    // Exports CategoryRepository — used to validate categories in the
    // category → brands comparison endpoints.
    CategoriesModule,
  ],
  controllers: [BrandsController],
  providers: [
    BrandRepository,
    BrandBranchRepository,
    BrandsService,
    BrandBranchService,
  ],
  exports: [BrandRepository, BrandsService],
})
export class BrandsModule {}
