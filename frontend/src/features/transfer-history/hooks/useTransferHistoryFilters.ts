import { useEffect, useState } from 'react';
import type { TransferStatus } from '@/constants/enums';
import { useTransferHistory } from '@/hooks/useTransferHistory';
import {
    DEFAULT_HISTORY_STATUSES,
    HISTORY_STATUSES,
} from '../lib/statuses';

export function useTransferHistoryFilters(isAdmin: boolean) {
    const [selectedStatuses, setSelectedStatuses] = useState<TransferStatus[]>(
        DEFAULT_HISTORY_STATUSES,
    );
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [productId, setProductId] = useState('');
    const [branchId, setBranchId] = useState('');

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
        setBranchId('');
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
