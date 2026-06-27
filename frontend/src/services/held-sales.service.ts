import api from './api';
import type { IApiResponse, IHeldSale, IHeldSalePayload } from '@/types';

/** Server-persisted held (parked) sales — park / recall across terminals. */
export const heldSalesService = {
    /** `GET /pos/held-sales` — the branch's shelf, each with its snapshot. */
    list: async (): Promise<IHeldSale[]> => {
        const response = await api.get<IApiResponse<IHeldSale[]>>(
            '/pos/held-sales',
        );
        return response.data.data;
    },

    /** `POST /pos/held-sales` — park the current cart. */
    hold: async (payload: IHeldSalePayload): Promise<IHeldSale> => {
        const response = await api.post<IApiResponse<IHeldSale>>(
            '/pos/held-sales',
            payload,
        );
        return response.data.data;
    },

    /** `DELETE /pos/held-sales/:id` — drop a parked sale. */
    discard: async (id: string): Promise<void> => {
        await api.delete(`/pos/held-sales/${id}`);
    },
};
