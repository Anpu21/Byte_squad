import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntry } from '@/modules/accounting-core/entities/ledger-entry.entity';
import { Account } from '@/modules/accounting-core/entities/account.entity';
import { JournalVoucher } from '@/modules/accounting-core/entities/journal-voucher.entity';
import { JournalCounter } from '@/modules/accounting-core/entities/journal-counter.entity';
import { Expense } from '@/modules/accounting-core/entities/expense.entity';
import { AccountingController } from '@/modules/accounting-core/accounting.controller';
import { JournalVouchersController } from '@/modules/accounting-core/journal-vouchers.controller';
import { AccountingService } from '@/modules/accounting-core/accounting.service';
import { AccountingRepository } from '@/modules/accounting-core/accounting.repository';
import { AccountsRepository } from '@/modules/accounting-core/accounts.repository';
import { JournalVouchersService } from '@/modules/accounting-core/journal-vouchers.service';
import { ProfitLossSalesRepository } from '@/modules/accounting-core/profit-loss-sales.repository';
import { AccountingPeriodsModule } from '@/modules/accounting-periods/accounting-periods.module';

/**
 * Double-entry posting engine — the hub of the accounting domain. Owns the
 * chart of accounts, ledger, journal vouchers, and expenses. Other domains
 * (POS, purchases, customer orders, inventory) import this to post entries
 * via AccountingService.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      LedgerEntry,
      Account,
      JournalVoucher,
      JournalCounter,
      Expense,
    ]),
    AccountingPeriodsModule,
  ],
  controllers: [AccountingController, JournalVouchersController],
  providers: [
    AccountingService,
    AccountingRepository,
    AccountsRepository,
    JournalVouchersService,
    ProfitLossSalesRepository,
  ],
  exports: [AccountingService, JournalVouchersService],
})
export class AccountingCoreModule {}
