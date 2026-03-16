import api from './api';
import type { IApiResponse, ICashierDashboard } from '@/types';

export const posService = {
    getCashierDashboard: async (): Promise<ICashierDashboard> => {
        const response = await api.get<IApiResponse<ICashierDashboard>>('/pos/my-dashboard');
        return response.data.data;
    },
};
