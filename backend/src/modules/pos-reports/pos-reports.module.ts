import { Module } from '@nestjs/common';
import { SalesReportsController } from '@/modules/pos-reports/sales-reports.controller';
import { SalesReportsService } from '@/modules/pos-reports/sales-reports.service';
import { SalesReportsRepository } from '@/modules/pos-reports/sales-reports.repository';

/**
 * Sales reporting — salesman performance and aggregate sales reads. The
 * repository runs raw queries off the DataSource (no forFeature), so this
 * module is a self-contained leaf.
 */
@Module({
  controllers: [SalesReportsController],
  providers: [SalesReportsRepository, SalesReportsService],
  exports: [],
})
export class PosReportsModule {}
