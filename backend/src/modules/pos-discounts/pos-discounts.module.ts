import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountScheme } from '@/modules/pos-discounts/entities/discount-scheme.entity';
import { DiscountSchemesController } from '@/modules/pos-discounts/discount-schemes.controller';
import { DiscountSchemesService } from '@/modules/pos-discounts/discount-schemes.service';
import { DiscountSchemesRepository } from '@/modules/pos-discounts/discount-schemes.repository';

/**
 * Discount schemes — CRUD over the reusable discount rules applied at checkout.
 * Self-contained leaf: owns the discount_scheme table and depends on no other
 * module.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DiscountScheme])],
  controllers: [DiscountSchemesController],
  providers: [DiscountSchemesRepository, DiscountSchemesService],
  exports: [],
})
export class PosDiscountsModule {}
