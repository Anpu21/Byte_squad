import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from '@/modules/suppliers/entities/supplier.entity';
import { SuppliersRepository } from '@/modules/suppliers/suppliers.repository';
import { SuppliersService } from '@/modules/suppliers/suppliers.service';
import { SuppliersController } from '@/modules/suppliers/suppliers.controller';

/**
 * Supplier master module — the "party" registry behind the purchases
 * workflow. PurchasesModule imports this to resolve/validate suppliers on
 * GRNs, payments, and returns.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  providers: [SuppliersRepository, SuppliersService],
  controllers: [SuppliersController],
  exports: [SuppliersService, SuppliersRepository, TypeOrmModule],
})
export class SuppliersModule {}
