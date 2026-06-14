import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useStockTransfers } from '@/hooks/useStockTransfers';
import { stockTransfersService } from '@/services/stock-transfers.service';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { IStockTransferRequest } from '@/types';

export type ScopeTab = 'my-requests' | 'incoming' | 'history';

export const TABS: { key: ScopeTab; label: string }[] = [
    { key: 'my-requests', label: 'My Requests' },
    { key: 'incoming', label: 'Incoming' },
    { key: 'history', label: 'History' },
];

const TAB_PARAM = 'tab';
const VALID_TABS: ScopeTab[] = ['my-requests', 'incoming', 'history'];

function isScopeTab(value: string | null): value is ScopeTab {
    return value !== null && (VALID_TABS as string[]).includes(value);
}

export function useTransferRequestsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [shippingId, setShippingId] = useState<string | null>(null);
    const [receivingId, setReceivingId] = useState<string | null>(null);

    const tab = useMemo<ScopeTab>(() => {
        const raw = searchParams.get(TAB_PARAM);
        return isScopeTab(raw) ? raw : 'my-requests';
    }, [searchParams]);

    const setTab = useCallback(
        (next: ScopeTab) => {
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    if (next === 'my-requests') {
                        params.delete(TAB_PARAM);
                    } else {
                        params.set(TAB_PARAM, next);
                    }
                    return params;
                },
                { replace: true },
            );
        },
        [setSearchParams],
    );

    const myRequests = useStockTransfers({ scope: 'my-requests' });
    const incoming = useStockTransfers({ scope: 'incoming' });

    const active = tab === 'incoming' ? incoming : myRequests;

    const handleShip = async (transfer: IStockTransferRequest) => {
        setShippingId(transfer.id);
        try {
            await stockTransfersService.ship(transfer.id);
            toast.success('Transfer marked as shipped');
            incoming.refetch();
        } catch (err) {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? String(err.response.data.message)
                    : 'Failed to ship transfer';
            toast.error(message);
        } finally {
            setShippingId(null);
        }
    };

    const handleReceive = async (transfer: IStockTransferRequest) => {
        setReceivingId(transfer.id);
        try {
            await stockTransfersService.receive(transfer.id);
            toast.success('Transfer received');
            myRequests.refetch();
        } catch (err) {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? String(err.response.data.message)
                    : 'Failed to receive transfer';
            toast.error(message);
        } finally {
            setReceivingId(null);
        }
    };

    return {
        tab,
        setTab,
        items: active.items,
        isLoading: active.isLoading,
        myCount: myRequests.total,
        incomingCount: incoming.total,
        shippingId,
        handleShip,
        receivingId,
        handleReceive,
        goNew: () => navigate(FRONTEND_ROUTES.TRANSFERS_NEW),
        goDetail: (id: string) =>
            navigate(FRONTEND_ROUTES.TRANSFER_DETAIL.replace(':id', id)),
    };
}
