import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useStockTransfers } from '@/hooks/useStockTransfers';
import { stockTransfersService } from '@/services/stock-transfers.service';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { IStockTransferRequest } from '@/types';

export type ScopeTab = 'my-requests' | 'incoming';

export const TABS: { key: ScopeTab; label: string }[] = [
    { key: 'my-requests', label: 'My Requests' },
    { key: 'incoming', label: 'Incoming' },
];

export function useTransferRequestsPage() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<ScopeTab>('my-requests');
    const [shippingId, setShippingId] = useState<string | null>(null);

    const myRequests = useStockTransfers({ scope: 'my-requests' });
    const incoming = useStockTransfers({ scope: 'incoming' });

    const active = tab === 'my-requests' ? myRequests : incoming;

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

    return {
        tab,
        setTab,
        items: active.items,
        isLoading: active.isLoading,
        myCount: myRequests.total,
        incomingCount: incoming.total,
        shippingId,
        handleShip,
        goNew: () => navigate(FRONTEND_ROUTES.TRANSFERS_NEW),
        goDetail: (id: string) =>
            navigate(FRONTEND_ROUTES.TRANSFER_DETAIL.replace(':id', id)),
    };
}
