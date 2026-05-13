import api from './api';
import type {
    IApiResponse,
    ILoyaltyHistoryResponse,
    ILoyaltySummary,
} from '@/types';

interface ListHistoryQuery {
    limit?: number;
    offset?: number;
}

export const loyaltyService = {
    getMine: async (): Promise<ILoyaltySummary> => {
        const response = await api.get<IApiResponse<ILoyaltySummary>>(
            '/loyalty/me',
        );
        return response.data.data;
    },
    getHistory: async (
        query: ListHistoryQuery = {},
    ): Promise<ILoyaltyHistoryResponse> => {
        const response = await api.get<IApiResponse<ILoyaltyHistoryResponse>>(
            '/loyalty/me/history',
            { params: query },
        );
        return response.data.data;
    },
};
