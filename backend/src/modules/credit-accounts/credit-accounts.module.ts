import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditAccount } from '@/modules/credit-accounts/entities/credit-account.entity';
import { CreditAccountTransaction } from '@/modules/credit-accounts/entities/credit-account-transaction.entity';
import { CreditAccountsRepository } from '@/modules/credit-accounts/credit-accounts.repository';
import { CreditAccountsService } from '@/modules/credit-accounts/credit-accounts.service';
import { CreditAccountsController } from '@/modules/credit-accounts/credit-accounts.controller';
import { CreditAccountTransactionsRepository } from '@/modules/credit-accounts/credit-account-transactions.repository';
import { Sale } from '@pos/entities/sale.entity';
import { NotificationsModule } from '@notifications/notifications.module';
import { UsersModule } from '@users/users.module';
import { AccountingModule } from '@accounting/accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreditAccount, CreditAccountTransaction, Sale]),
    NotificationsModule,
    UsersModule,
    AccountingModule,
  ],
  controllers: [CreditAccountsController],
  providers: [
    CreditAccountsRepository,
    CreditAccountTransactionsRepository,
    CreditAccountsService,
  ],
  exports: [
    CreditAccountsService,
    CreditAccountsRepository,
    CreditAccountTransactionsRepository,
  ],
})
export class CreditAccountsModule {}
