import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersModule } from '@/modules/suppliers/suppliers.module';
import { Grn } from '@/modules/purchases/entities/grn.entity';
import { GrnItem } from '@/modules/purchases/entities/grn-item.entity';
import { PurchaseDocCounter } from '@/modules/purchases/entities/purchase-doc-counter.entity';
import { SupplierPayment } from '@/modules/purchases/entities/supplier-payment.entity';
import { SupplierPaymentAllocation } from '@/modules/purchases/entities/supplier-payment-allocation.entity';
import { PurchaseDocNumberService } from '@/modules/purchases/purchase-doc-number.service';
import { GrnsRepository } from '@/modules/purchases/grns.repository';
import { GrnsService } from '@/modules/purchases/grns.service';
import { GrnsController } from '@/modules/purchases/grns.controller';
import { SupplierPaymentsRepository } from '@/modules/purchases/supplier-payments.repository';
import { SupplierPaymentsService } from '@/modules/purchases/supplier-payments.service';
import { SupplierPaymentsController } from '@/modules/purchases/supplier-payments.controller';
import { PayablesReportsRepository } from '@/modules/purchases/payables-reports.repository';
import { PayablesReportsService } from '@/modules/purchases/payables-reports.service';
import { PurchasesReportsController } from '@/modules/purchases/purchases-reports.controller';

/**
 * Purchases module — the BUSY-style procurement cycle: GRN purchase
 * vouchers (stock IN + weighted-average cost + batches + movements +
 * ledger + the supplier bill), bill-by-bill supplier payments, and the
 * payables outstanding/ageing reports. Cross-entity writes ride each
 * transaction's EntityManager via the module's own repositories, so no
 * other module's private repositories are touched.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Grn,
      GrnItem,
      PurchaseDocCounter,
      SupplierPayment,
      SupplierPaymentAllocation,
    ]),
    SuppliersModule,
  ],
  providers: [
    PurchaseDocNumberService,
    GrnsRepository,
    GrnsService,
    SupplierPaymentsRepository,
    SupplierPaymentsService,
    PayablesReportsRepository,
    PayablesReportsService,
  ],
  controllers: [
    GrnsController,
    SupplierPaymentsController,
    PurchasesReportsController,
  ],
  exports: [
    PurchaseDocNumberService,
    GrnsRepository,
    GrnsService,
    SupplierPaymentsRepository,
    SupplierPaymentsService,
  ],
})
export class PurchasesModule {}
