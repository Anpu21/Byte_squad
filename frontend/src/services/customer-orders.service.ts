import api from './api';
import type {
    IApiResponse,
    ICustomerOrder,
    ICustomerOrderCreateResponse,
    ICustomerOrderCreatePayload,
    IFulfillOrderPayload,
    CustomerOrderStatus,
    ITransaction,
} from '@/types';

interface ListOrdersQuery {
    branchId?: string;
    status?: CustomerOrderStatus;
    q?: string;
    limit?: number;
}

export const customerOrdersService = {
    create: async (
        payload: ICustomerOrderCreatePayload,
    ): Promise<ICustomerOrderCreateResponse> => {
        const response = await api.post<
            IApiResponse<ICustomerOrderCreateResponse>
        >(
            '/customer-orders',
            payload,
        );
        return response.data.data;
    },

    findByCode: async (code: string): Promise<ICustomerOrder> => {
        const response = await api.get<IApiResponse<ICustomerOrder>>(
            `/customer-orders/code/${code}`,
        );
        return response.data.data;
    },

    listMine: async (): Promise<ICustomerOrder[]> => {
        const response = await api.get<IApiResponse<ICustomerOrder[]>>(
            '/customer-orders/mine',
        );
        return response.data.data;
    },

    cancelMine: async (id: string): Promise<ICustomerOrder> => {
        const response = await api.patch<IApiResponse<ICustomerOrder>>(
            `/customer-orders/${id}/cancel`,
        );
        return response.data.data;
    },

    listForStaff: async (
        query: ListOrdersQuery = {},
    ): Promise<ICustomerOrder[]> => {
        const response = await api.get<IApiResponse<ICustomerOrder[]>>(
            '/customer-orders',
            { params: query },
        );
        return response.data.data;
    },

    findByCodeStaff: async (code: string): Promise<ICustomerOrder> => {
        const response = await api.get<IApiResponse<ICustomerOrder>>(
            `/customer-orders/code/${code}`,
        );
        return response.data.data;
    },

    acceptByStaff: async (id: string): Promise<ICustomerOrder> => {
        const response = await api.patch<IApiResponse<ICustomerOrder>>(
            `/customer-orders/${id}/accept`,
        );
        return response.data.data;
    },

    rejectByStaff: async (id: string): Promise<ICustomerOrder> => {
        const response = await api.patch<IApiResponse<ICustomerOrder>>(
            `/customer-orders/${id}/reject`,
        );
        return response.data.data;
    },

    fulfill: async (
        code: string,
        payload: IFulfillOrderPayload,
    ): Promise<{ order: ICustomerOrder; transaction: ITransaction | null }> => {
        const response = await api.post<
            IApiResponse<{
                order: ICustomerOrder;
                transaction: ITransaction | null;
            }>
        >(`/customer-orders/code/${code}/fulfill`, payload);
        return response.data.data;
    },
};
