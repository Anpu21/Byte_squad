import { useMemo, useState } from 'react';
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

    // One card open at a time — the QR + breakdown reveal inline (no modal).
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const toggleExpanded = (id: string) =>
        setExpandedId((cur) => (cur === id ? null : id));

    // Active = still on the pickup path (placed or ready); reinforces the header
    // badge + stat. "This month" sums what was spent in the current calendar month.
    const activeCount = orders.filter(
        (o) => o.status === 'pending' || o.status === 'accepted',
    ).length;

    const thisMonthTotal = useMemo(() => {
        const now = new Date();
        return orders
            .filter((o) => {
                const d = new Date(o.createdAt);
                return (
                    d.getFullYear() === now.getFullYear() &&
                    d.getMonth() === now.getMonth()
                );
            })
            .reduce((sum, o) => sum + (o.finalTotal ?? 0), 0);
    }, [orders]);

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
            queryClient.invalidateQueries({
                queryKey: queryKeys.loyalty.mine(),
            });
            queryClient.invalidateQueries({
                queryKey: ['loyalty', 'history'],
            });
        } catch {
            toast.error('Could not cancel');
        }
    };

    return {
        orders,
        isLoading,
        expandedId,
        toggleExpanded,
        activeCount,
        thisMonthTotal,
        onCancel,
    };
}
