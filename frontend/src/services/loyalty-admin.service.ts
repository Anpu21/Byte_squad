import api from './api';
import type {
    IApiResponse,
    ILoyaltyCustomersResponse,
    ILoyaltyHistoryResponse,
    ILoyaltySettings,
} from '@/types';

export interface UpdateLoyaltySettingsPayload {
    earnPoints?: number;
    earnPerAmount?: number;
    pointValue?: number;
    redeemCapPercent?: number;
}

export interface ListCustomersQuery {
    search?: string;
    limit?: number;
    offset?: number;
}

export const loyaltyAdminService = {
    getSettings: async (): Promise<ILoyaltySettings> => {
        const response = await api.get<IApiResponse<ILoyaltySettings>>(
            '/admin/loyalty/settings',
        );
        return response.data.data;
    },
    updateSettings: async (
        payload: UpdateLoyaltySettingsPayload,
    ): Promise<ILoyaltySettings> => {
        const response = await api.patch<IApiResponse<ILoyaltySettings>>(
            '/admin/loyalty/settings',
            payload,
        );
        return response.data.data;
    },
    listCustomers: async (
        query: ListCustomersQuery = {},
    ): Promise<ILoyaltyCustomersResponse> => {
        const response = await api.get<
            IApiResponse<ILoyaltyCustomersResponse>
        >('/admin/loyalty/customers', { params: query });
        return response.data.data;
    },
    listCustomerHistory: async (
        userId: string,
        query: { limit?: number; offset?: number } = {},
    ): Promise<ILoyaltyHistoryResponse> => {
        const response = await api.get<IApiResponse<ILoyaltyHistoryResponse>>(
            `/admin/loyalty/customers/${userId}/history`,
            { params: query },
        );
        return response.data.data;
    },
};
