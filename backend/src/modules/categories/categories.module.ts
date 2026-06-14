import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '@/modules/categories/entities/category.entity';
import { Product } from '@products/entities/product.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { CategoryRepository } from '@/modules/categories/category.repository';
import { CategoriesService } from '@/modules/categories/categories.service';
import { CategoriesController } from '@/modules/categories/categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product, Sale, SaleItem])],
  controllers: [CategoriesController],
  providers: [CategoryRepository, CategoriesService],
  exports: [CategoryRepository, CategoriesService],
})
export class CategoriesModule {}
