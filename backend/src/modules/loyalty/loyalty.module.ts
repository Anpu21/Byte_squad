import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty/entities/loyalty-ledger-entry.entity';
import { LoyaltySettings } from '@/modules/loyalty/entities/loyalty-settings.entity';
import { LoyaltyController } from '@/modules/loyalty/loyalty.controller';
import { LoyaltyAdminController } from '@/modules/loyalty/loyalty-admin.controller';
import { LoyaltyRepository } from '@/modules/loyalty/loyalty.repository';
import { LoyaltySettingsRepository } from '@/modules/loyalty/loyalty-settings.repository';
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';
import { LoyaltySettingsService } from '@/modules/loyalty/loyalty-settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyAccount,
      LoyaltyLedgerEntry,
      LoyaltySettings,
    ]),
  ],
  controllers: [LoyaltyController, LoyaltyAdminController],
  providers: [
    LoyaltyRepository,
    LoyaltySettingsRepository,
    LoyaltyService,
    LoyaltySettingsService,
  ],
  exports: [LoyaltyService, LoyaltySettingsService],
})
export class LoyaltyModule {}
