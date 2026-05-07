import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';
import { PublicService } from '@/modules/public/public.service';
import { PublicProductsController } from '@/modules/public/public-products.controller';
import { PublicBranchesController } from '@/modules/public/public-branches.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Branch])],
  controllers: [PublicProductsController, PublicBranchesController],
  providers: [PublicService],
})
export class PublicModule {}
