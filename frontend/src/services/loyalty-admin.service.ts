import api from './api';
import type {
    IApiResponse,
    ILoyaltyCustomersResponse,
    ILoyaltyHistoryResponse,
    ILoyaltySettings,
    ILoyaltyDashboardStats,
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
        memberId: string,
        query: { limit?: number; offset?: number } = {},
    ): Promise<ILoyaltyHistoryResponse> => {
        // /loyalty (not /admin) — the only history route that also
        // resolves walk-in wallets, which have no userId.
        const response = await api.get<IApiResponse<ILoyaltyHistoryResponse>>(
            `/loyalty/customers/${memberId}/history`,
            { params: query },
        );
        return response.data.data;
    },
    adjustPoints: async (
        role: 'admin' | 'manager',
        memberId: string,
        payload: { points: number; reason: string },
    ): Promise<void> => {
        const url =
            role === 'admin'
                ? `/admin/loyalty/customers/${memberId}/adjust`
                : `/manager/loyalty/customers/${memberId}/adjust`;
        await api.post(url, payload);
    },
    getDashboardStats: async (
        role: 'admin' | 'manager',
    ): Promise<ILoyaltyDashboardStats> => {
        const url =
            role === 'admin'
                ? '/admin/loyalty/dashboard'
                : '/manager/loyalty/dashboard';
        const response =
            await api.get<IApiResponse<ILoyaltyDashboardStats>>(url);
        return response.data.data;
    },
};
