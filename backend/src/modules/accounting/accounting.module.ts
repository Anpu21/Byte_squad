import { Module } from '@nestjs/common';

import { AccountingController } from '@accounting/accounting.controller';
import { AccountingService } from '@accounting/accounting.service';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([LedgerEntry, Expense, Transaction, TransactionItem]),
  ],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
