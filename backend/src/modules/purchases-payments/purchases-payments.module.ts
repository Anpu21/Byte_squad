import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersModule } from '@/modules/suppliers/suppliers.module';
import { PurchasesDocNumberingModule } from '@/modules/purchases-doc-numbering/purchases-doc-numbering.module';
import { SupplierPayment } from '@/modules/purchases-payments/entities/supplier-payment.entity';
import { SupplierPaymentAllocation } from '@/modules/purchases-payments/entities/supplier-payment-allocation.entity';
import { SupplierPaymentsRepository } from '@/modules/purchases-payments/supplier-payments.repository';
import { SupplierPaymentsService } from '@/modules/purchases-payments/supplier-payments.service';
import { SupplierPaymentsController } from '@/modules/purchases-payments/supplier-payments.controller';

/**
 * Supplier-payment module — bill-by-bill settlements with allocations across
 * GRNs and opening balances. Exports its repository so PurchasesReturnsModule
 * can reconcile debit notes against payments.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SupplierPayment, SupplierPaymentAllocation]),
    PurchasesDocNumberingModule,
    SuppliersModule,
  ],
  controllers: [SupplierPaymentsController],
  providers: [SupplierPaymentsRepository, SupplierPaymentsService],
  exports: [SupplierPaymentsRepository, SupplierPaymentsService],
})
export class PurchasesPaymentsModule {}
