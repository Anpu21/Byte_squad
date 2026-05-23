import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosService } from '@pos/pos.service';
import { PosController } from '@pos/pos.controller';
import { PosRepository } from '@pos/pos.repository';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { IdempotencyKey } from '@pos/entities/idempotency-key.entity';
import { AccountingModule } from '@accounting/accounting.module';
import { InventoryModule } from '@inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, IdempotencyKey]),
    AccountingModule,
    InventoryModule,
  ],
  controllers: [PosController],
  providers: [PosService, PosRepository],
  exports: [PosService, PosRepository],
})
export class PosModule {}
