import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosService } from '@pos/pos.service';
import { PosController } from '@pos/pos.controller';
import { PosRepository } from '@pos/pos.repository';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { IdempotencyKey } from '@pos/entities/idempotency-key.entity';
import { AccountingModule } from '@accounting/accounting.module';
import { InventoryModule } from '@inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionItem, IdempotencyKey]),
    AccountingModule,
    InventoryModule,
  ],
  controllers: [PosController],
  providers: [PosService, PosRepository],
  exports: [PosService, PosRepository],
})
export class PosModule {}
