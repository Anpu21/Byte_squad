import { TransferStatus } from '@common/enums/transfer-status.enum';

export interface ListIncomingFilter {
  branchId: string;
  status?: TransferStatus;
  page: number;
  limit: number;
}
