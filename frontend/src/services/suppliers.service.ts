import api from './api';
import type {
    IApiResponse,
    ISupplier,
    ISupplierPayload,
    ISupplierUpdatePayload,
    ISuppliersListResponse,
    SupplierStatus,
} from '@/types';

export interface IListSuppliersQuery {
    search?: string;
    status?: SupplierStatus;
    limit?: number;
    offset?: number;
}

/** Thin client over the supplier-master endpoints (admin/manager only). */
export const suppliersService = {
    /** `GET /suppliers` */
    list: async (
        query: IListSuppliersQuery = {},
    ): Promise<ISuppliersListResponse> => {
        const response = await api.get<IApiResponse<ISuppliersListResponse>>(
            '/suppliers',
            { params: query },
        );
        return response.data.data;
    },

    /** `GET /suppliers/:id` */
    getById: async (id: string): Promise<ISupplier> => {
        const response = await api.get<IApiResponse<ISupplier>>(
            `/suppliers/${id}`,
        );
        return response.data.data;
    },

    /** `POST /suppliers` */
    create: async (payload: ISupplierPayload): Promise<ISupplier> => {
        const response = await api.post<IApiResponse<ISupplier>>(
            '/suppliers',
            payload,
        );
        return response.data.data;
    },

    /** `PATCH /suppliers/:id` */
    update: async (
        id: string,
        payload: ISupplierUpdatePayload,
    ): Promise<ISupplier> => {
        const response = await api.patch<IApiResponse<ISupplier>>(
            `/suppliers/${id}`,
            payload,
        );
        return response.data.data;
    },
};
