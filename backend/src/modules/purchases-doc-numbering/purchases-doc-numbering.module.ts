import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseDocCounter } from '@/modules/purchases-doc-numbering/entities/purchase-doc-counter.entity';
import { PurchaseDocNumberService } from '@/modules/purchases-doc-numbering/purchase-doc-number.service';

/**
 * Purchases document-numbering module — the atomic per-branch, per-type
 * counter behind every purchase document number (GRN/PO/payment/return).
 * Imported by the other purchases modules to allocate the next number.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PurchaseDocCounter])],
  providers: [PurchaseDocNumberService],
  exports: [PurchaseDocNumberService],
})
export class PurchasesDocNumberingModule {}
