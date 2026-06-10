import api from './api';
import type {
    GrnPaymentStatus,
    GrnStatus,
    IApiResponse,
    IGrn,
    IGrnPayload,
    IGrnsListResponse,
} from '@/types';

export interface IListGrnsQuery {
    supplierId?: string;
    branchId?: string;
    status?: GrnStatus;
    paymentStatus?: GrnPaymentStatus;
    /** ISO date `YYYY-MM-DD`, inclusive. */
    startDate?: string;
    /** ISO date `YYYY-MM-DD`, inclusive. */
    endDate?: string;
    limit?: number;
    offset?: number;
}

/** Thin client over the purchases endpoints (admin/manager only). */
export const purchasesService = {
    /** `GET /purchases/grns` */
    listGrns: async (
        query: IListGrnsQuery = {},
    ): Promise<IGrnsListResponse> => {
        const response = await api.get<IApiResponse<IGrnsListResponse>>(
            '/purchases/grns',
            { params: query },
        );
        return response.data.data;
    },

    /** `GET /purchases/grns/:id` */
    getGrn: async (id: string): Promise<IGrn> => {
        const response = await api.get<IApiResponse<IGrn>>(
            `/purchases/grns/${id}`,
        );
        return response.data.data;
    },

    /** `POST /purchases/grns` — the receive transaction. */
    createGrn: async (payload: IGrnPayload): Promise<IGrn> => {
        const response = await api.post<IApiResponse<IGrn>>(
            '/purchases/grns',
            payload,
        );
        return response.data.data;
    },

    /** `POST /purchases/grns/:id/void` — admin only. */
    voidGrn: async (id: string, reason: string): Promise<IGrn> => {
        const response = await api.post<IApiResponse<IGrn>>(
            `/purchases/grns/${id}/void`,
            { reason },
        );
        return response.data.data;
    },
};
