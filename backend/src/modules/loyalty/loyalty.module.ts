import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty/entities/loyalty-ledger-entry.entity';
import { LoyaltyController } from '@/modules/loyalty/loyalty.controller';
import { LoyaltyRepository } from '@/modules/loyalty/loyalty.repository';
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyAccount, LoyaltyLedgerEntry])],
  controllers: [LoyaltyController],
  providers: [LoyaltyRepository, LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
