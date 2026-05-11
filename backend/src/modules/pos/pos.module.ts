import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosService } from '@pos/pos.service';
import { PosController } from '@pos/pos.controller';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { IdempotencyKey } from '@pos/entities/idempotency-key.entity';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      TransactionItem,
      IdempotencyKey,
      LedgerEntry,
    ]),
  ],
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}
