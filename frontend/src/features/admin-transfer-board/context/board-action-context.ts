import { createContext, useContext } from 'react';
import type { IStockTransferRequest } from '@/types';
import type { BoardModalAction } from '../hooks/useBoardActionModal';

/** Opens the shared board action modal (approve/reject/ship/receive/cancel). */
export type OpenBoardAction = (
    transfer: IStockTransferRequest,
    action: BoardModalAction,
) => void;

export const BoardActionContext = createContext<OpenBoardAction | null>(null);

export function useBoardAction(): OpenBoardAction | null {
    return useContext(BoardActionContext);
}
