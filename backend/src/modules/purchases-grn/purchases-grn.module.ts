import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingModule } from '@accounting/accounting.module';
import { SuppliersModule } from '@/modules/suppliers/suppliers.module';
import { PurchasesDocNumberingModule } from '@/modules/purchases-doc-numbering/purchases-doc-numbering.module';
import { PurchasesOrdersModule } from '@/modules/purchases-orders/purchases-orders.module';
import { Grn } from '@/modules/purchases-grn/entities/grn.entity';
import { GrnItem } from '@/modules/purchases-grn/entities/grn-item.entity';
import { GrnsRepository } from '@/modules/purchases-grn/grns.repository';
import { GrnsService } from '@/modules/purchases-grn/grns.service';
import { GrnsController } from '@/modules/purchases-grn/grns.controller';

/**
 * Goods-receipt (GRN) module — the BUSY-style purchase voucher: stock IN +
 * weighted-average cost + batches + movements + ledger + the supplier bill.
 * Pairs with PurchasesOrdersModule via forwardRef (each receives the other's
 * repository to convert/back-reference purchase orders).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Grn, GrnItem]),
    PurchasesDocNumberingModule,
    SuppliersModule,
    AccountingModule,
    forwardRef(() => PurchasesOrdersModule),
  ],
  controllers: [GrnsController],
  providers: [GrnsRepository, GrnsService],
  exports: [GrnsRepository, GrnsService],
})
export class PurchasesGrnModule {}
