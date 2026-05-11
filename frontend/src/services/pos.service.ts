import api from './api';
import type {
    IApiResponse,
    ICashierDashboard,
    IAdminDashboard,
    ITransaction,
    ICashierTransactionsSummary,
} from '@/types';

export interface ICreateTransactionPayload {
    type: 'sale' | 'return' | 'void';
    discountAmount?: number;
    discountType?: 'percentage' | 'fixed' | 'none';
    paymentMethod: 'cash' | 'card' | 'mobile';
    notes?: string;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        discountAmount?: number;
        discountType?: 'percentage' | 'fixed' | 'none';
    }[];
}

export const posService = {
    getCashierDashboard: async (): Promise<ICashierDashboard> => {
        const response = await api.get<IApiResponse<ICashierDashboard>>('/pos/my-dashboard');
        return response.data.data;
    },

    getMyTransactions: async (): Promise<ICashierTransactionsSummary> => {
        const response = await api.get<IApiResponse<ICashierTransactionsSummary>>('/pos/my-transactions');
        return response.data.data;
    },

    getAllTransactions: async (): Promise<ICashierTransactionsSummary> => {
        const response = await api.get<IApiResponse<ICashierTransactionsSummary>>('/pos/all-transactions');
        return response.data.data;
    },

    getAdminDashboard: async (): Promise<IAdminDashboard> => {
        const response = await api.get<IApiResponse<IAdminDashboard>>('/pos/admin-dashboard');
        return response.data.data;
    },

    createTransaction: async (
        payload: ICreateTransactionPayload,
        idempotencyKey?: string,
    ): Promise<ITransaction> => {
        // The X-Idempotency-Key header lets the backend safely de-dupe a
        // retried request. Even if the backend currently ignores it, sending
        // the header is harmless and lets the FE drive a single semantic sale.
        const config = idempotencyKey
            ? { headers: { 'X-Idempotency-Key': idempotencyKey } }
            : undefined;
        const response = await api.post<IApiResponse<ITransaction>>(
            '/pos/transactions',
            payload,
            config,
        );
        return response.data.data;
    },

    getTransactions: async (): Promise<ITransaction[]> => {
        const response = await api.get<IApiResponse<ITransaction[]>>('/pos/transactions');
        return response.data.data;
    },
};
