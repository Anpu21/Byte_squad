import { Injectable } from '@nestjs/common';
import {
  LoyaltySettings,
  LOYALTY_SETTINGS_ROW_ID,
} from '@/modules/loyalty/entities/loyalty-settings.entity';
import { LoyaltySettingsRepository } from '@/modules/loyalty/loyalty-settings.repository';
import { UpdateLoyaltySettingsDto } from '@/modules/loyalty/dto/update-loyalty-settings.dto';

const DEFAULT_SETTINGS = {
  earnPoints: 1,
  earnPerAmount: 100,
  pointValue: 1,
  redeemCapPercent: 20,
};

@Injectable()
export class LoyaltySettingsService {
  constructor(private readonly repo: LoyaltySettingsRepository) {}

  async get(): Promise<LoyaltySettings> {
    const existing = await this.repo.find();
    if (existing) return existing;
    return this.repo.upsert({
      id: LOYALTY_SETTINGS_ROW_ID,
      ...DEFAULT_SETTINGS,
      updatedByUserId: null,
    });
  }

  async update(
    dto: UpdateLoyaltySettingsDto,
    actorId: string,
  ): Promise<LoyaltySettings> {
    const current = await this.get();
    return this.repo.upsert({
      id: LOYALTY_SETTINGS_ROW_ID,
      earnPoints: dto.earnPoints ?? current.earnPoints,
      earnPerAmount: dto.earnPerAmount ?? current.earnPerAmount,
      pointValue: dto.pointValue ?? current.pointValue,
      redeemCapPercent: dto.redeemCapPercent ?? current.redeemCapPercent,
      updatedByUserId: actorId,
    });
  }
}
