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
    minRedeemablePoints?: number;
    silverTierPoints?: number;
    goldTierPoints?: number;
}

export interface ListCustomersQuery {
    search?: string;
    branchId?: string;
    activeSince?: string;
    minPoints?: number;
    maxPoints?: number;
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
        role: 'admin' | 'manager',
        query: ListCustomersQuery = {},
    ): Promise<ILoyaltyCustomersResponse> => {
        const url = role === 'admin' ? '/admin/loyalty/customers' : '/manager/loyalty/customers';
        const response = await api.get<
            IApiResponse<ILoyaltyCustomersResponse>
        >(url, { params: query });
        return response.data.data;
    },
    listCustomerHistory: async (
        role: 'admin' | 'manager',
        userId: string,
        query: { limit?: number; offset?: number } = {},
    ): Promise<ILoyaltyHistoryResponse> => {
        const url = role === 'admin' ? `/admin/loyalty/customers/${userId}/history` : `/manager/loyalty/customers/${userId}/history`;
        const response = await api.get<IApiResponse<ILoyaltyHistoryResponse>>(
            url,
            { params: query },
        );
        return response.data.data;
    },
    adjustPoints: async (
        userId: string,
        payload: { points: number; reason: string }
    ): Promise<void> => {
        await api.post(`/admin/loyalty/customers/${userId}/adjust`, payload);
    },
    getDashboardStats: async (): Promise<any> => {
        const response = await api.get('/admin/loyalty/dashboard');
        return response.data.data;
    },
};
