import { OverviewSummary } from '@admin-portal/types/overview-summary.type';
import { BranchPerformance } from '@admin-portal/types/branch-performance.type';
import { OverviewAlert } from '@admin-portal/types/overview-alert.type';

export interface OverviewResponse {
  summary: OverviewSummary;
  branches: BranchPerformance[];
  alerts: OverviewAlert[];
}
