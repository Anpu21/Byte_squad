import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedBranch } from '@/store/slices/adminContextSlice';
import { selectSelectedBranchId } from '@/store/selectors/adminContext';
import type { TransferStatus } from '@/constants/enums';
import { useTransferHistory } from '@/hooks/useTransferHistory';
import {
    DEFAULT_HISTORY_STATUSES,
    HISTORY_STATUSES,
} from '../lib/statuses';

export function useTransferHistoryFilters(isAdmin: boolean) {
    const dispatch = useAppDispatch();
    const pinnedBranchId = useAppSelector(selectSelectedBranchId);
    const branchId = pinnedBranchId ?? '';

    const [selectedStatuses, setSelectedStatuses] = useState<TransferStatus[]>(
        DEFAULT_HISTORY_STATUSES,
    );
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [productId, setProductId] = useState('');

    const setBranchId = useCallback(
        (value: string) => {
            dispatch(setSelectedBranch(value || null));
        },
        [dispatch],
    );

    const transferHistory = useTransferHistory();

    useEffect(() => {
        transferHistory.updateFilters({
            status:
                selectedStatuses.length === HISTORY_STATUSES.length
                    ? undefined
                    : selectedStatuses,
            from: from || undefined,
            to: to || undefined,
            productId: productId || undefined,
            branchId: isAdmin && branchId ? branchId : undefined,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStatuses, from, to, productId, branchId, isAdmin]);

    const toggleStatus = (status: TransferStatus) => {
        setSelectedStatuses((prev) => {
            if (prev.includes(status)) {
                if (prev.length === 1) return prev;
                return prev.filter((s) => s !== status);
            }
            return [...prev, status];
        });
    };

    const clearFilters = () => {
        setSelectedStatuses(DEFAULT_HISTORY_STATUSES);
        setFrom('');
        setTo('');
        setProductId('');
        dispatch(setSelectedBranch(null));
    };

    const hasActiveFilters =
        from !== '' ||
        to !== '' ||
        productId !== '' ||
        branchId !== '' ||
        selectedStatuses.length !== HISTORY_STATUSES.length;

    return {
        selectedStatuses,
        toggleStatus,
        from,
        setFrom,
        to,
        setTo,
        productId,
        setProductId,
        branchId,
        setBranchId,
        clearFilters,
        hasActiveFilters,
        transferHistory,
    };
}
