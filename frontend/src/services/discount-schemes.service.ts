import api from './api';
import type {
    IApiResponse,
    IDiscountScheme,
    IDiscountSchemePayload,
    IDiscountSchemesListResponse,
} from '@/types';

/** Discount-scheme client (POS auto-discount rules). */
export const discountSchemesService = {
    /** `GET /pos/schemes/active` — today's rules for the till. */
    active: async (): Promise<IDiscountScheme[]> => {
        const response = await api.get<IApiResponse<IDiscountScheme[]>>(
            '/pos/schemes/active',
        );
        return response.data.data;
    },

    /** `GET /pos/schemes` — management list (admin / manager). */
    list: async (
        isActive?: boolean,
    ): Promise<IDiscountSchemesListResponse> => {
        const response = await api.get<
            IApiResponse<IDiscountSchemesListResponse>
        >('/pos/schemes', {
            params: isActive === undefined ? undefined : { isActive },
        });
        return response.data.data;
    },

    /** `POST /pos/schemes` */
    create: async (
        payload: IDiscountSchemePayload,
    ): Promise<IDiscountScheme> => {
        const response = await api.post<IApiResponse<IDiscountScheme>>(
            '/pos/schemes',
            payload,
        );
        return response.data.data;
    },

    /** `PATCH /pos/schemes/:id` */
    update: async (
        id: string,
        payload: Partial<IDiscountSchemePayload>,
    ): Promise<IDiscountScheme> => {
        const response = await api.patch<IApiResponse<IDiscountScheme>>(
            `/pos/schemes/${id}`,
            payload,
        );
        return response.data.data;
    },

    /** `DELETE /pos/schemes/:id` */
    remove: async (id: string): Promise<void> => {
        await api.delete(`/pos/schemes/${id}`);
    },
};
