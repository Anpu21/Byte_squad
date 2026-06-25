import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiscalPeriodLock } from '@/modules/accounting-periods/entities/fiscal-period-lock.entity';
import { FiscalPeriodsService } from '@/modules/accounting-periods/fiscal-periods.service';
import { FiscalPeriodsController } from '@/modules/accounting-periods/fiscal-periods.controller';

/**
 * Fiscal-period locking — the "books are closed" guard. Leaf module
 * (DataSource only). AccountingCoreModule imports this so the posting engine
 * can reject entries against locked periods.
 */
@Module({
  imports: [TypeOrmModule.forFeature([FiscalPeriodLock])],
  controllers: [FiscalPeriodsController],
  providers: [FiscalPeriodsService],
  exports: [FiscalPeriodsService],
})
export class AccountingPeriodsModule {}
