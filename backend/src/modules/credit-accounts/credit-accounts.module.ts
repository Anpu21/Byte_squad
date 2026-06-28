import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditAccount } from '@/modules/credit-accounts/entities/credit-account.entity';
import { CreditAccountTransaction } from '@/modules/credit-accounts/entities/credit-account-transaction.entity';
import { CreditAccountsRepository } from '@/modules/credit-accounts/credit-accounts.repository';
import { CreditAccountsService } from '@/modules/credit-accounts/credit-accounts.service';
import { CreditAccountsController } from '@/modules/credit-accounts/credit-accounts.controller';
import { NotificationsModule } from '@notifications/notifications.module';
import { UsersModule } from '@users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreditAccount, CreditAccountTransaction]),
    NotificationsModule,
    UsersModule,
  ],
  controllers: [CreditAccountsController],
  providers: [CreditAccountsRepository, CreditAccountsService],
  exports: [CreditAccountsService, CreditAccountsRepository],
})
export class CreditAccountsModule {}
