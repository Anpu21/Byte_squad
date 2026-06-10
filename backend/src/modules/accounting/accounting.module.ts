import { Module } from '@nestjs/common';

import { AccountingController } from '@accounting/accounting.controller';
import { AccountingService } from '@accounting/accounting.service';
import { AccountingRepository } from '@accounting/accounting.repository';
import { AccountsRepository } from '@accounting/accounts.repository';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { Account } from '@accounting/entities/account.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([LedgerEntry, Account, Expense, Sale, SaleItem]),
  ],
  controllers: [AccountingController],
  providers: [AccountingService, AccountingRepository, AccountsRepository],
  exports: [AccountingService, AccountingRepository, AccountsRepository],
})
export class AccountingModule {}
