import { Module } from '@nestjs/common';

import { AccountingController } from '@accounting/accounting.controller';
import { AccountingService } from '@accounting/accounting.service';
import { AccountingRepository } from '@accounting/accounting.repository';
import { AccountsRepository } from '@accounting/accounts.repository';
import { JournalVouchersService } from '@accounting/journal-vouchers.service';
import { JournalVouchersController } from '@accounting/journal-vouchers.controller';
import { FinancialReportsService } from '@accounting/financial-reports.service';
import { FinancialReportsRepository } from '@accounting/financial-reports.repository';
import { FinancialReportsController } from '@accounting/financial-reports.controller';
import { FiscalPeriodsService } from '@accounting/fiscal-periods.service';
import { FiscalPeriodsController } from '@accounting/fiscal-periods.controller';
import { FiscalPeriodLock } from '@accounting/entities/fiscal-period-lock.entity';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { Account } from '@accounting/entities/account.entity';
import { JournalVoucher } from '@accounting/entities/journal-voucher.entity';
import { JournalCounter } from '@accounting/entities/journal-counter.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LedgerEntry,
      Account,
      JournalVoucher,
      JournalCounter,
      FiscalPeriodLock,
      Expense,
      Sale,
      SaleItem,
    ]),
  ],
  controllers: [
    AccountingController,
    JournalVouchersController,
    FinancialReportsController,
    FiscalPeriodsController,
  ],
  providers: [
    AccountingService,
    AccountingRepository,
    AccountsRepository,
    JournalVouchersService,
    FinancialReportsService,
    FinancialReportsRepository,
    FiscalPeriodsService,
  ],
  exports: [
    AccountingService,
    AccountingRepository,
    AccountsRepository,
    FiscalPeriodsService,
  ],
})
export class AccountingModule {}
