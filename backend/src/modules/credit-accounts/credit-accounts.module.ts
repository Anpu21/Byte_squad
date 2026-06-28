import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
    // Dedicated short-lived signer for the manager over-limit override token —
    // same secret as auth, but a 5-minute expiry scoped to this purpose.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_SECRET') ?? 'ledgerpro-dev-secret-change-me',
        signOptions: { expiresIn: '5m' },
      }),
    }),
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
