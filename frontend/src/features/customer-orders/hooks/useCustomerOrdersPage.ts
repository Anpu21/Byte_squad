import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from '@/store/hooks';
import {
    selectIsAdmin,
    selectIsCashier,
    selectIsManager,
} from '@/store/selectors/auth';
import { profileService } from '@/services/profile.service';
import { queryKeys } from '@/lib/queryKeys';
import { useCustomerOrdersQuery } from './useCustomerOrdersQuery';
import { useOrderActions } from './useOrderActions';
import { useOrderNotificationSocket } from './useOrderNotificationSocket';
import { computeOrdersKpis } from '../lib/metrics';

export function useCustomerOrdersPage() {
    const { user } = useAuth();
    const isAdmin = useAppSelector(selectIsAdmin);
    const isManager = useAppSelector(selectIsManager);
    const isCashier = useAppSelector(selectIsCashier);
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
        enabled: !isAdmin,
    });

    const selectedRequest =
        requestsApi.requests.find((r) => r.id === selectedRequestId) ?? null;

    const kpis = useMemo(
        () => computeOrdersKpis(requestsApi.requests),
        [requestsApi.requests],
    );

    const canReview = (branchId: string) =>
        isAdmin || (isManager && user?.branchId === branchId);

    const hasFilters =
        requestsApi.statusFilter !== '' || requestsApi.search.trim() !== '';
    const needsBranchAssignment = !isAdmin && !user?.branchId;

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
