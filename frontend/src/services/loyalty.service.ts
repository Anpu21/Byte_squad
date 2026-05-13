import api from './api';
import type { IApiResponse, ILoyaltySummary } from '@/types';

export const loyaltyService = {
    getMine: async (): Promise<ILoyaltySummary> => {
        const response = await api.get<IApiResponse<ILoyaltySummary>>(
            '/loyalty/me',
        );
        return response.data.data;
    },
};
