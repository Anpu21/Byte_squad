import { Module } from '@nestjs/common';
import { PayablesReportsRepository } from '@/modules/purchases-reports/payables-reports.repository';
import { PayablesReportsService } from '@/modules/purchases-reports/payables-reports.service';
import { PurchasesReportsController } from '@/modules/purchases-reports/purchases-reports.controller';

/**
 * Payables-reporting module — read-only outstanding/ageing and supplier
 * statement reports. Its repository is DataSource-injected (no forFeature).
 */
@Module({
  imports: [],
  controllers: [PurchasesReportsController],
  providers: [PayablesReportsRepository, PayablesReportsService],
  exports: [],
})
export class PurchasesReportsModule {}
