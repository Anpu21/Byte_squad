import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profile.service';
import { queryKeys } from '@/lib/queryKeys';
import { UserRole } from '@/constants/enums';
import { useCustomerOrdersQuery } from './useCustomerOrdersQuery';
import { useOrderActions } from './useOrderActions';
import { useOrderNotificationSocket } from './useOrderNotificationSocket';
import { computeOrdersKpis } from '../lib/metrics';

export function useCustomerOrdersPage() {
    const { user } = useAuth();
    const requestsApi = useCustomerOrdersQuery();
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
        null,
    );
    const actions = useOrderActions({
        onCleared: () => setSelectedRequestId(null),
    });

    useOrderNotificationSocket({
        userRole: user?.role,
        userBranchId: user?.branchId,
    });

    const { data: profile } = useQuery({
        queryKey: queryKeys.profile.self(),
        queryFn: profileService.getProfile,
        enabled: user?.role !== UserRole.ADMIN,
    });

    const selectedRequest =
        requestsApi.requests.find((r) => r.id === selectedRequestId) ?? null;

    const kpis = useMemo(
        () => computeOrdersKpis(requestsApi.requests),
        [requestsApi.requests],
    );

    const canReview = (branchId: string) =>
        user?.role === UserRole.ADMIN ||
        (user?.role === UserRole.MANAGER && user.branchId === branchId);

    const isAdmin = user?.role === UserRole.ADMIN;
    const isCashier = user?.role === UserRole.CASHIER;
    const hasFilters =
        requestsApi.statusFilter !== '' || requestsApi.search.trim() !== '';
    const needsBranchAssignment =
        user?.role !== UserRole.ADMIN && !user?.branchId;

    return {
        user,
        requests: requestsApi.requests,
        isLoading: requestsApi.isLoading,
        statusFilter: requestsApi.statusFilter,
        setStatusFilter: requestsApi.setStatusFilter,
        search: requestsApi.search,
        setSearch: requestsApi.setSearch,
        selectedRequestId,
        setSelectedRequestId,
        selectedRequest,
        actionPending: actions.actionPending,
        onAccept: actions.onAccept,
        onReject: actions.onReject,
        canReview,
        kpis,
        isAdmin,
        isCashier,
        hasFilters,
        needsBranchAssignment,
        profileBranchName: profile?.branch?.name ?? null,
    };
}
