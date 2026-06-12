import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { SalesReportsRepository } from '@pos/sales-reports.repository';
import type { SalesmanReportRow } from '@pos/types/salesman-report-row.type';

export interface ReportsActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

export interface SalesmanReportQuery {
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_WINDOW_DAYS = 30;

/**
 * Salesman-wise (cashier-wise) sales report. Managers are pinned to
 * their branch; admins see everything or pass `branchId` to narrow.
 * Defaults to the trailing 30 days when no window is given.
 */
@Injectable()
export class SalesReportsService {
  constructor(private readonly reports: SalesReportsRepository) {}

  async salesman(
    query: SalesmanReportQuery,
    actor: ReportsActor,
  ): Promise<{
    startDate: string;
    endDate: string;
    rows: SalesmanReportRow[];
  }> {
    const { startDate, endDate } = this.resolveWindow(query);
    const branchId = this.resolveBranch(query.branchId, actor);
    const rows = await this.reports.salesmanSummary({
      startDate,
      endDate,
      branchId,
    });
    return { startDate, endDate, rows };
  }

  private resolveWindow(query: SalesmanReportQuery): {
    startDate: string;
    endDate: string;
  } {
    for (const value of [query.startDate, query.endDate]) {
      if (value !== undefined && !ISO_DATE.test(value)) {
        throw new BadRequestException('Dates must be YYYY-MM-DD');
      }
    }
    const endDate = query.endDate ?? new Date().toISOString().slice(0, 10);
    const startDate =
      query.startDate ??
      new Date(
        new Date(`${endDate}T00:00:00Z`).getTime() -
          (DEFAULT_WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .slice(0, 10);
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be on or before endDate');
    }
    return { startDate, endDate };
  }

  private resolveBranch(
    requested: string | undefined,
    actor: ReportsActor,
  ): string | undefined {
    if (actor.role === UserRole.ADMIN) return requested;
    if (!actor.branchId) {
      throw new ForbiddenException('No branch linked to your account');
    }
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException('Cannot report on another branch');
    }
    return actor.branchId;
  }
}
