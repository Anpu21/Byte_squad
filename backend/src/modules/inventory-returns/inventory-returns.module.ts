import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesReturn } from '@/modules/inventory-returns/entities/sales-return.entity';
import { SalesReturnItem } from '@/modules/inventory-returns/entities/sales-return-item.entity';
import { SalesReturnRepository } from '@/modules/inventory-returns/sales-return.repository';
import { ReturnsService } from '@/modules/inventory-returns/returns.service';
import { ReturnsController } from '@/modules/inventory-returns/returns.controller';
import { PosSalesModule } from '@/modules/pos-sales/pos-sales.module';
import { AccountingCoreModule } from '@/modules/accounting-core/accounting-core.module';

/**
 * Sales returns — item-level reversals of POS sales: good units are restocked,
 * bad units scrapped, and the customer refunded (a DEBIT ledger entry). Reads
 * sales through PosService and posts the refund via AccountingService.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SalesReturn, SalesReturnItem]),
    PosSalesModule,
    AccountingCoreModule,
  ],
  controllers: [ReturnsController],
  providers: [SalesReturnRepository, ReturnsService],
  exports: [],
})
export class InventoryReturnsModule {}
