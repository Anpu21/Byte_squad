import type { IStockTransferRequest } from '@/types';

export interface TransferBoardGroup {
    key: string;
    batchId: string | null;
    transfers: IStockTransferRequest[];
    primary: IStockTransferRequest;
}
