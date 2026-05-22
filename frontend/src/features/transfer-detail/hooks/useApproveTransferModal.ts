import { useCallback, useState } from 'react';
import type { ITransferSourceOption } from '@/types';
import { useSourceOptionsQuery } from './useSourceOptionsQuery';

export interface ApproveModalState {
    chosenSourceId: string;
    setChosenSourceId: (id: string) => void;
    approvedQuantityStr: string;
    setApprovedQuantityStr: (value: string) => void;
    approvalNote: string;
    setApprovalNote: (value: string) => void;
    sourceOptions: ITransferSourceOption[];
    sourceLoading: boolean;
    reset: (requestedQuantity: number) => void;
}

interface UseApproveTransferModalArgs {
    transferId: string | undefined;
    isOpen: boolean;
}

export function useApproveTransferModal({
    transferId,
    isOpen,
}: UseApproveTransferModalArgs): ApproveModalState {
    const [chosenSourceId, setChosenSourceId] = useState('');
    const [approvedQuantityStr, setApprovedQuantityStr] = useState('');
    const [approvalNote, setApprovalNote] = useState('');

    const query = useSourceOptionsQuery(transferId, isOpen);

    const reset = useCallback((requestedQuantity: number) => {
        setChosenSourceId('');
        setApprovedQuantityStr(String(requestedQuantity));
        setApprovalNote('');
    }, []);

    return {
        chosenSourceId,
        setChosenSourceId,
        approvedQuantityStr,
        setApprovedQuantityStr,
        approvalNote,
        setApprovalNote,
        sourceOptions: query.data ?? [],
        sourceLoading: query.isLoading && isOpen,
        reset,
    };
}
