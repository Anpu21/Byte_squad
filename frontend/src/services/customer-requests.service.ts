import api from './api';
import type {
    IApiResponse,
    ICustomerRequest,
    ICustomerRequestCreatePayload,
    IFulfillRequestPayload,
    CustomerRequestStatus,
    ITransaction,
} from '@/types';

interface ListRequestsQuery {
    branchId?: string;
    status?: CustomerRequestStatus;
    q?: string;
    limit?: number;
}

export const customerRequestsService = {
    create: async (
        payload: ICustomerRequestCreatePayload,
    ): Promise<ICustomerRequest> => {
        const response = await api.post<IApiResponse<ICustomerRequest>>(
            '/customer-requests',
            payload,
        );
        return response.data.data;
    },

    findByCode: async (code: string): Promise<ICustomerRequest> => {
        const response = await api.get<IApiResponse<ICustomerRequest>>(
            `/customer-requests/code/${code}`,
        );
        return response.data.data;
    },

    listMine: async (): Promise<ICustomerRequest[]> => {
        const response = await api.get<IApiResponse<ICustomerRequest[]>>(
            '/customer-requests/mine',
        );
        return response.data.data;
    },

    cancelMine: async (id: string): Promise<ICustomerRequest> => {
        const response = await api.patch<IApiResponse<ICustomerRequest>>(
            `/customer-requests/${id}/cancel`,
        );
        return response.data.data;
    },

    listForStaff: async (
        query: ListRequestsQuery = {},
    ): Promise<ICustomerRequest[]> => {
        const response = await api.get<IApiResponse<ICustomerRequest[]>>(
            '/customer-requests',
            { params: query },
        );
        return response.data.data;
    },

    findByCodeStaff: async (code: string): Promise<ICustomerRequest> => {
        const response = await api.get<IApiResponse<ICustomerRequest>>(
            `/customer-requests/code/${code}`,
        );
        return response.data.data;
    },

    acceptByStaff: async (id: string): Promise<ICustomerRequest> => {
        const response = await api.patch<IApiResponse<ICustomerRequest>>(
            `/customer-requests/${id}/accept`,
        );
        return response.data.data;
    },

    rejectByStaff: async (id: string): Promise<ICustomerRequest> => {
        const response = await api.patch<IApiResponse<ICustomerRequest>>(
            `/customer-requests/${id}/reject`,
        );
        return response.data.data;
    },

    fulfill: async (
        code: string,
        payload: IFulfillRequestPayload,
    ): Promise<{ request: ICustomerRequest; transaction: ITransaction }> => {
        const response = await api.post<
            IApiResponse<{
                request: ICustomerRequest;
                transaction: ITransaction;
            }>
        >(`/customer-requests/code/${code}/fulfill`, payload);
        return response.data.data;
    },
};
