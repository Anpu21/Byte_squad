import api from './api';
import type { IApiResponse, INotification } from '@/types';

export const notificationsService = {
    list: async (): Promise<INotification[]> => {
        const response = await api.get<IApiResponse<INotification[]>>(
            '/notifications',
        );
        return response.data.data;
    },

    getById: async (id: string): Promise<INotification> => {
        const response = await api.get<IApiResponse<INotification>>(
            `/notifications/${id}`,
        );
        return response.data.data;
    },

    markAsRead: async (id: string): Promise<void> => {
        await api.patch(`/notifications/${id}/read`);
    },

    markAllAsRead: async (): Promise<void> => {
        await api.patch('/notifications/read-all');
    },
};
