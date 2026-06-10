import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersModule } from '@/modules/suppliers/suppliers.module';
import { Grn } from '@/modules/purchases/entities/grn.entity';
import { GrnItem } from '@/modules/purchases/entities/grn-item.entity';
import { PurchaseDocCounter } from '@/modules/purchases/entities/purchase-doc-counter.entity';
import { PurchaseDocNumberService } from '@/modules/purchases/purchase-doc-number.service';
import { GrnsRepository } from '@/modules/purchases/grns.repository';
import { GrnsService } from '@/modules/purchases/grns.service';
import { GrnsController } from '@/modules/purchases/grns.controller';

/**
 * Purchases module — the BUSY-style procurement cycle. Slice 2 ships the
 * GRN (purchase voucher): stock IN + weighted-average cost + batch rows +
 * movements + ledger posting + the supplier bill, all in one transaction.
 * Cross-entity writes go through `GrnsRepository` on the transaction's
 * EntityManager, so no other module's private repositories are touched.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Grn, GrnItem, PurchaseDocCounter]),
    SuppliersModule,
  ],
  providers: [PurchaseDocNumberService, GrnsRepository, GrnsService],
  controllers: [GrnsController],
  exports: [PurchaseDocNumberService, GrnsRepository, GrnsService],
})
export class PurchasesModule {}
