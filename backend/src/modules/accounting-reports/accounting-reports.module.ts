import { Module } from '@nestjs/common';
import { FinancialReportsController } from '@/modules/accounting-reports/financial-reports.controller';
import { FinancialReportsService } from '@/modules/accounting-reports/financial-reports.service';
import { FinancialReportsRepository } from '@/modules/accounting-reports/financial-reports.repository';

/**
 * Financial statements (trial balance, balance sheet, day book) derived from
 * the ledger. Leaf module — its repository reads through DataSource directly,
 * so no TypeOrmModule.forFeature is required.
 */
@Module({
  imports: [],
  controllers: [FinancialReportsController],
  providers: [FinancialReportsRepository, FinancialReportsService],
  exports: [],
})
export class AccountingReportsModule {}
