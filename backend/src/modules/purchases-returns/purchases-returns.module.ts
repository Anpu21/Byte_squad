import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingModule } from '@accounting/accounting.module';
import { PurchasesDocNumberingModule } from '@/modules/purchases-doc-numbering/purchases-doc-numbering.module';
import { PurchasesGrnModule } from '@/modules/purchases-grn/purchases-grn.module';
import { PurchasesPaymentsModule } from '@/modules/purchases-payments/purchases-payments.module';
import { PurchaseReturn } from '@/modules/purchases-returns/entities/purchase-return.entity';
import { PurchaseReturnItem } from '@/modules/purchases-returns/entities/purchase-return-item.entity';
import { PurchaseReturnsRepository } from '@/modules/purchases-returns/purchase-returns.repository';
import { PurchaseReturnsService } from '@/modules/purchases-returns/purchase-returns.service';
import { PurchaseReturnsController } from '@/modules/purchases-returns/purchase-returns.controller';

/**
 * Purchase-return (debit-note) module — reverses received goods against a
 * GRN with stock + ledger postings and payment reconciliation. Pulls the GRN
 * and supplier-payment repositories from their owning modules.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseReturn, PurchaseReturnItem]),
    PurchasesDocNumberingModule,
    AccountingModule,
    PurchasesGrnModule,
    PurchasesPaymentsModule,
  ],
  controllers: [PurchaseReturnsController],
  providers: [PurchaseReturnsRepository, PurchaseReturnsService],
  exports: [PurchaseReturnsService],
})
export class PurchasesReturnsModule {}
