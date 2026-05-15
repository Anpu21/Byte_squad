import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LoyaltySettings,
  LOYALTY_SETTINGS_ROW_ID,
} from '@/modules/loyalty/entities/loyalty-settings.entity';

@Injectable()
export class LoyaltySettingsRepository {
  constructor(
    @InjectRepository(LoyaltySettings)
    private readonly repo: Repository<LoyaltySettings>,
  ) {}

  async find(): Promise<LoyaltySettings | null> {
    return this.repo.findOne({ where: { id: LOYALTY_SETTINGS_ROW_ID } });
  }

  async upsert(
    partial: Partial<LoyaltySettings> & { id: string },
  ): Promise<LoyaltySettings> {
    await this.repo.save(this.repo.create(partial));
    const fresh = await this.find();
    if (!fresh) {
      throw new Error('Loyalty settings row missing after save');
    }
    return fresh;
  }
}
