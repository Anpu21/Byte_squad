import { useCallback, useState } from 'react';
import type { ITransferSourceOption } from '@/types';
import { useSourceOptionsQuery } from './useSourceOptionsQuery';

export interface ApproveModalState {
    chosenSourceId: string;
    setChosenSourceId: (id: string) => void;
    approvalNote: string;
    setApprovalNote: (value: string) => void;
    sourceOptions: ITransferSourceOption[];
    sourceLoading: boolean;
    reset: () => void;
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
    const [approvalNote, setApprovalNote] = useState('');

    const query = useSourceOptionsQuery(transferId, isOpen);

    const reset = useCallback(() => {
        setChosenSourceId('');
        setApprovalNote('');
    }, []);

    return {
        chosenSourceId,
        setChosenSourceId,
        approvalNote,
        setApprovalNote,
        sourceOptions: query.data ?? [],
        sourceLoading: query.isLoading && isOpen,
        reset,
    };
}
