import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltyCustomer } from '@/modules/loyalty/entities/loyalty-customer.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty/entities/loyalty-ledger-entry.entity';
import { LoyaltySettings } from '@/modules/loyalty/entities/loyalty-settings.entity';
import { LoyaltyController } from '@/modules/loyalty/loyalty.controller';
import { LoyaltyAdminController } from '@/modules/loyalty/loyalty-admin.controller';
import { LoyaltyRepository } from '@/modules/loyalty/loyalty.repository';
import { LoyaltyCustomersRepository } from '@/modules/loyalty/loyalty-customers.repository';
import { LoyaltySettingsRepository } from '@/modules/loyalty/loyalty-settings.repository';
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';
import { LoyaltySettingsService } from '@/modules/loyalty/loyalty-settings.service';
import { UsersModule } from '@users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyAccount,
      LoyaltyCustomer,
      LoyaltyLedgerEntry,
      LoyaltySettings,
    ]),
    UsersModule,
  ],
  controllers: [LoyaltyController, LoyaltyAdminController],
  providers: [
    LoyaltyRepository,
    LoyaltyCustomersRepository,
    LoyaltySettingsRepository,
    LoyaltyService,
    LoyaltySettingsService,
  ],
  exports: [LoyaltyService, LoyaltySettingsService],
})
export class LoyaltyModule {}
