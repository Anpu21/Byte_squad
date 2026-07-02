import type { IPaginated } from '@common/pagination/paginated.type';
import type {
  BranchAnalyticsProductRow,
  BranchAnalyticsProductSort,
} from './branch-analytics-product-row.type';

export interface BranchAnalyticsProductsResponse extends IPaginated<BranchAnalyticsProductRow> {
  /** Selected branches in request order — drives stable client-side colors. */
  branches: { branchId: string; branchName: string }[];
  /** Echoed range (ISO) so the client can label the comparison. */
  startDate: string;
  endDate: string;
  /** The metric the roster was ranked by. */
  sort: BranchAnalyticsProductSort;
}
