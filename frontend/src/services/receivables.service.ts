import api from './api';
import type {
    IApiResponse,
    ICreditStatement,
    IReceivableRow,
    IReceiveCreditPaymentPayload,
} from '@/types';

/** Customer receivables (AR) client — admin/manager only. */
export const receivablesService = {
    /** `GET /pos/receivables` */
    list: async (): Promise<IReceivableRow[]> => {
        const response = await api.get<IApiResponse<IReceivableRow[]>>(
            '/pos/receivables',
        );
        return response.data.data;
    },

    /** `GET /pos/receivables/:userId/statement` */
    statement: async (userId: string): Promise<ICreditStatement> => {
        const response = await api.get<IApiResponse<ICreditStatement>>(
            `/pos/receivables/${userId}/statement`,
        );
        return response.data.data;
    },

    /** `POST /pos/receivables/:userId/payments` — FIFO settles invoices. */
    receivePayment: async (
        userId: string,
        payload: IReceiveCreditPaymentPayload,
    ): Promise<ICreditStatement> => {
        const response = await api.post<IApiResponse<ICreditStatement>>(
            `/pos/receivables/${userId}/payments`,
            payload,
        );
        return response.data.data;
    },

    /** `PATCH /pos/receivables/:userId/credit-limit` (null = unlimited). */
    setCreditLimit: async (
        userId: string,
        creditLimit: number | null,
    ): Promise<ICreditStatement> => {
        const response = await api.patch<IApiResponse<ICreditStatement>>(
            `/pos/receivables/${userId}/credit-limit`,
            { creditLimit },
        );
        return response.data.data;
    },
};
