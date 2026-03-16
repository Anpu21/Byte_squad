import api from './api';
import type { IApiResponse, ICashierDashboard, IAdminDashboard } from '@/types';

export const posService = {
    getCashierDashboard: async (): Promise<ICashierDashboard> => {
        const response = await api.get<IApiResponse<ICashierDashboard>>('/pos/my-dashboard');
        return response.data.data;
    },

    getAdminDashboard: async (): Promise<IAdminDashboard> => {
        const response = await api.get<IApiResponse<IAdminDashboard>>('/pos/admin-dashboard');
        return response.data.data;
    },
};
