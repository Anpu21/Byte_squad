import { BranchComparisonEntry } from '@admin-portal/types/branch-comparison-entry.type';

export interface BranchComparisonResponse {
  startDate: string;
  endDate: string;
  branches: BranchComparisonEntry[];
}
