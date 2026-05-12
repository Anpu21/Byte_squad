import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { queryKeys } from '@/lib/queryKeys';
import { FRONTEND_ROUTES } from '@/constants/routes';

export function useNotificationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.notifications.byId(id ?? ''),
        queryFn: () => notificationsService.getById(id!),
        enabled: !!id,
        retry: (failureCount, error) => {
            const status = (error as { response?: { status?: number } })
                ?.response?.status;
            if (status === 404) return false;
            return failureCount < 1;
        },
    });

    const markReadMutation = useMutation({
        mutationFn: (notificationId: string) =>
            notificationsService.markAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.notifications.list(),
            });
        },
    });

    const notification = query.data;
    const notFound =
        !id ||
        (query.isError &&
            (query.error as { response?: { status?: number } })?.response
                ?.status === 404);
    const isLoading = !!id && query.isLoading;
    const errorMessage =
        query.isError && !notFound ? 'Could not load this notification.' : null;

    useEffect(() => {
        if (notification && !notification.isRead) {
            markReadMutation.mutate(notification.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notification?.id, notification?.isRead]);

    return {
        notification,
        isLoading,
        notFound,
        errorMessage,
        goBack: () => navigate(FRONTEND_ROUTES.NOTIFICATIONS),
        retry: () => navigate(0),
    };
}
