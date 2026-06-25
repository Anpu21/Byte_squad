import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltySettings } from '@/modules/loyalty-settings/entities/loyalty-settings.entity';
import { LoyaltySettingsRepository } from '@/modules/loyalty-settings/loyalty-settings.repository';
import { LoyaltySettingsService } from '@/modules/loyalty-settings/loyalty-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltySettings])],
  providers: [LoyaltySettingsRepository, LoyaltySettingsService],
  exports: [LoyaltySettingsService],
})
export class LoyaltySettingsModule {}
