import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { customerOrdersService } from '@/services/customer-orders.service';
import { queryKeys } from '@/lib/queryKeys';
import { useConfirm } from '@/hooks/useConfirm';

export function useMyOrdersPage() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: queryKeys.customerOrders.my(),
        queryFn: customerOrdersService.listMine,
    });

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
        null,
    );

    const selectedOrder = orders.find((r) => r.id === selectedOrderId) ?? null;

    const onCancel = async (id: string) => {
        const ok = await confirm({
            title: 'Cancel this pickup order?',
            body: "The branch won't fulfill it. You can place a new order any time.",
            confirmLabel: 'Cancel order',
            cancelLabel: 'Keep it',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await customerOrdersService.cancelMine(id);
            toast.success('Order cancelled');
            await queryClient.invalidateQueries({
                queryKey: queryKeys.customerOrders.my(),
            });
        } catch {
            toast.error('Could not cancel');
        }
    };

    return {
        requests: orders,
        isLoading,
        selectedRequestId: selectedOrderId,
        selectedRequest: selectedOrder,
        openDetails: setSelectedOrderId,
        closeDetails: () => setSelectedOrderId(null),
        onCancel,
    };
}
