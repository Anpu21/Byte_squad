import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getNotificationSocket } from '@/services/socket.service';
import { queryKeys } from '@/lib/queryKeys';
import { UserRole } from '@/constants/enums';

interface UseRequestNotificationSocketArgs {
    userRole: string | undefined;
    userBranchId: string | null | undefined;
}

export function useOrderNotificationSocket({
    userRole,
    userBranchId,
}: UseRequestNotificationSocketArgs) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = getNotificationSocket();
        const onCreated = (payload: { branchId: string }) => {
            if (
                userRole === UserRole.ADMIN ||
                payload.branchId === userBranchId
            ) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.customerOrders.all(),
                });
            }
        };
        socket.on('customer-order:created', onCreated);
        return () => {
            socket.off('customer-order:created', onCreated);
        };
    }, [userRole, userBranchId, queryClient]);
}
