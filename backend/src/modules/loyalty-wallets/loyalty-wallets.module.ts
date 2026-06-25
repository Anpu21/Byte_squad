import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyAccount } from '@/modules/loyalty-wallets/entities/loyalty-account.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty-wallets/entities/loyalty-ledger-entry.entity';
import { LoyaltyCustomer } from '@/modules/loyalty-customers/entities/loyalty-customer.entity';
import { LoyaltyController } from '@/modules/loyalty-wallets/loyalty.controller';
import { LoyaltyAdminController } from '@/modules/loyalty-wallets/loyalty-admin.controller';
import { LoyaltyManagerController } from '@/modules/loyalty-wallets/loyalty-manager.controller';
import { LoyaltyRepository } from '@/modules/loyalty-wallets/loyalty.repository';
import { LoyaltyService } from '@/modules/loyalty-wallets/loyalty.service';
import { LoyaltyWalletService } from '@/modules/loyalty-wallets/loyalty-wallet.service';
import { LoyaltySettingsModule } from '@/modules/loyalty-settings/loyalty-settings.module';
import { LoyaltyCustomersModule } from '@/modules/loyalty-customers/loyalty-customers.module';
import { UsersModule } from '@users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyAccount,
      LoyaltyLedgerEntry,
      LoyaltyCustomer,
    ]),
    LoyaltySettingsModule,
    LoyaltyCustomersModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [
    LoyaltyController,
    LoyaltyAdminController,
    LoyaltyManagerController,
  ],
  providers: [LoyaltyRepository, LoyaltyService, LoyaltyWalletService],
  exports: [LoyaltyService, LoyaltyWalletService],
})
export class LoyaltyWalletsModule {}
