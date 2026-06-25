import { Injectable } from '@nestjs/common';
import { PayablesReportsRepository } from '@/modules/purchases-reports/payables-reports.repository';
import type {
  PayablesAgeingRow,
  PayablesOutstandingRow,
} from '@/modules/purchases-reports/types/payables-report-row.type';

/**
 * Payables reporting — what BUSY gives "for free" from bill-by-bill:
 * supplier outstanding (opening + bills − payments) and ageing buckets
 * keyed on days overdue past each bill's due date.
 */
@Injectable()
export class PayablesReportsService {
  constructor(private readonly reports: PayablesReportsRepository) {}

  async outstanding(): Promise<PayablesOutstandingRow[]> {
    return this.reports.outstanding();
  }

  async ageing(): Promise<PayablesAgeingRow[]> {
    return this.reports.ageing();
  }
}
