import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { customerOrdersService } from '@/services/customer-orders.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from '@/store/hooks';
import {
    selectIsAdmin,
    selectIsCashier,
    selectIsManager,
} from '@/store/selectors/auth';
import { useConfirm } from '@/hooks/useConfirm';
import { useCustomerOrdersQuery } from '@/features/customer-orders/hooks/useCustomerOrdersQuery';
import { useOrderNotificationSocket } from '@/features/customer-orders/hooks/useOrderNotificationSocket';
import { computeOrdersKpis } from '@/features/customer-orders/lib/metrics';
import { isAwaitingCollection } from '@/features/customer-orders/lib/order-status';
import { useOrderFulfillment } from '@/features/scan-order/hooks/useOrderFulfillment';
import type { ICustomerOrder } from '@/types';

/**
 * Cashier Pickup-queue orchestrator. Reuses the customer-orders list query,
 * live socket, and KPIs; adds POS-local selection, code lookup, and in-place
 * fulfillment so a cashier collects an order without leaving the POS.
 */
export function usePosPickup() {
    const { user } = useAuth();
    const isAdmin = useAppSelector(selectIsAdmin);
    const isManager = useAppSelector(selectIsManager);
    const isCashier = useAppSelector(selectIsCashier);
    const queryClient = useQueryClient();
    const confirm = useConfirm();

    const listApi = useCustomerOrdersQuery();
    useOrderNotificationSocket({
        userRole: user?.role,
        userBranchId: user?.branchId,
    });

    const [selectedOrder, setSelectedOrder] = useState<ICustomerOrder | null>(
        null,
    );
    const [scanOpen, setScanOpen] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [looking, setLooking] = useState(false);
    const [actionPending, setActionPending] = useState(false);
    const manualInputRef = useRef<HTMLInputElement>(null);

    // Focus the code field on mount so hardware wedge scanners land there.
    useEffect(() => {
        manualInputRef.current?.focus();
    }, []);

    const invalidate = useCallback(
        () =>
            queryClient.invalidateQueries({
                queryKey: queryKeys.customerOrders.all(),
            }),
        [queryClient],
    );

    const fulfillment = useOrderFulfillment({
        order: selectedOrder,
        onFulfilled: () => {
            void invalidate();
            setSelectedOrder(null);
        },
    });

    const lookup = useCallback(async (codeRaw: string) => {
        const code = codeRaw.trim().toUpperCase();
        if (!code) return;
        setLooking(true);
        try {
            const found = await customerOrdersService.findByCodeStaff(code);
            setSelectedOrder(found);
            setScanOpen(false);
            setManualCode('');
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                toast.error('Order not found');
            } else {
                toast.error('Lookup failed');
            }
        } finally {
            setLooking(false);
        }
    }, []);

    const handleManualSubmit = (e: FormEvent) => {
        e.preventDefault();
        void lookup(manualCode);
    };

    const openOrder = (order: ICustomerOrder) => setSelectedOrder(order);
    const openOrderById = (id: string) => {
        const found = listApi.requests.find((r) => r.id === id);
        if (found) setSelectedOrder(found);
    };

    const markNotCollected = useCallback(
        async (id: string) => {
            const ok = await confirm({
                title: 'Mark as not collected?',
                body: 'Record this pickup order as a no-show — the customer never collected it.',
                confirmLabel: 'Not collected',
                tone: 'danger',
            });
            if (!ok) return;
            setActionPending(true);
            try {
                await customerOrdersService.markNotCollected(id);
                toast.success('Marked not collected');
                await invalidate();
                setSelectedOrder(null);
            } catch {
                toast.error('Could not update the order');
            } finally {
                setActionPending(false);
            }
        },
        [confirm, invalidate],
    );

    const kpis = useMemo(
        () => computeOrdersKpis(listApi.requests),
        [listApi.requests],
    );
    const awaitingCount = useMemo(
        () =>
            listApi.requests.filter((r) => isAwaitingCollection(r.status))
                .length,
        [listApi.requests],
    );
    const canManage = (branchId: string) =>
        isAdmin || ((isManager || isCashier) && user?.branchId === branchId);
    const hasFilters =
        listApi.statusFilter !== '' || listApi.search.trim() !== '';
    const needsBranchAssignment = !isAdmin && !user?.branchId;

    return {
        // queue
        requests: listApi.requests,
        isLoading: listApi.isLoading,
        statusFilter: listApi.statusFilter,
        setStatusFilter: listApi.setStatusFilter,
        search: listApi.search,
        setSearch: listApi.setSearch,
        kpis,
        awaitingCount,
        hasFilters,
        needsBranchAssignment,
        isAdmin,
        canManage,
        actionPending,
        // manual lookup
        manualCode,
        setManualCode,
        handleManualSubmit,
        manualInputRef,
        looking,
        // scan modal
        scanOpen,
        openScan: () => setScanOpen(true),
        closeScan: () => setScanOpen(false),
        onScan: lookup,
        // selection / fulfill
        selectedOrder,
        openOrder,
        openOrderById,
        closeOrder: () => setSelectedOrder(null),
        markNotCollected,
        fulfillment,
    };
}
