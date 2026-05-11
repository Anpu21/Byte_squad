import { TransferStatus } from '@common/enums/transfer-status.enum';

export interface ListAdminFilter {
  status?: TransferStatus;
  destinationBranchId?: string;
  sourceBranchId?: string;
  page: number;
  limit: number;
}
