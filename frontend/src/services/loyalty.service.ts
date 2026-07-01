import api from './api';
import type {
    IApiResponse,
    ILoyaltyCustomersResponse,
    ILoyaltyHistoryResponse,
    ILoyaltyLookupResult,
    ILoyaltySettings,
    ILoyaltySummary,
} from '@/types';

interface ListHistoryQuery {
    limit?: number;
    offset?: number;
}

interface IEnrollWalkInCustomerPayload {
    phone: string;
    firstName: string;
    lastName?: string;
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
    getSettings: async (): Promise<ILoyaltySettings> => {
        const response = await api.get<IApiResponse<ILoyaltySettings>>(
            '/loyalty/settings',
        );
        return response.data.data;
    },
    /**
     * POS-side phone lookup. Returns the wallet summary for the
     * matching online customer or walk-in account. The backend 404s
     * when no loyalty side owns the phone — callers are expected to
     * catch that as the "not yet enrolled" branch (not a real error).
     */
    lookupByPhone: async (phone: string): Promise<ILoyaltyLookupResult> => {
        const response = await api.get<IApiResponse<ILoyaltyLookupResult>>(
            '/loyalty/lookup',
            { params: { phone } },
        );
        return response.data.data;
    },
    /**
     * POS-side walk-in enrolment. Backend rejects when the phone
     * already collides with an online user or existing walk-in, so
     * the cashier UI should always run `lookupByPhone` first.
     */
    enrollWalkInCustomer: async (
        payload: IEnrollWalkInCustomerPayload,
    ): Promise<ILoyaltyLookupResult> => {
        const response = await api.post<IApiResponse<ILoyaltyLookupResult>>(
            '/loyalty/enroll',
            payload,
        );
        return response.data.data;
    },
    /**
     * Cashier/manager branch-scoped member list (mirrors the store-credit
     * accounts list). The backend pins non-admins to their own branch and
     * returns members homed there OR with branch ledger activity.
     */
    listBranchCustomers: async (
        params: { search?: string; limit?: number; offset?: number } = {},
    ): Promise<ILoyaltyCustomersResponse> => {
        const response = await api.get<IApiResponse<ILoyaltyCustomersResponse>>(
            '/loyalty/customers',
            { params },
        );
        return response.data.data;
    },
    /**
     * Points ledger for one branch member. `id` is the list row's id (a
     * user id or a walk-in id); the backend resolves the owning account
     * and enforces branch access for non-admins.
     */
    memberHistory: async (
        id: string,
        query: ListHistoryQuery = {},
    ): Promise<ILoyaltyHistoryResponse> => {
        const response = await api.get<IApiResponse<ILoyaltyHistoryResponse>>(
            `/loyalty/customers/${id}/history`,
            { params: query },
        );
        return response.data.data;
    },
};
