import { TransferStatus } from '@common/enums/transfer-status.enum';

export interface ListMineFilter {
  branchId: string;
  status?: TransferStatus;
  page: number;
  limit: number;
}
