import api from './api';
import type {
    GrnPaymentStatus,
    GrnStatus,
    IApiResponse,
    IGrn,
    IGrnPayload,
    IGrnsListResponse,
    IPayablesAgeingRow,
    IPayablesOutstandingRow,
    IPurchaseOrder,
    IPurchaseOrderPayload,
    IPurchaseOrdersListResponse,
    IPurchaseReturn,
    IPurchaseReturnPayload,
    IReorderSuggestionsReport,
    ISupplierPayment,
    ISupplierPaymentPayload,
    ISupplierPaymentsListResponse,
    PurchaseOrderStatus,
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

    /** `GET /purchases/payments` */
    listPayments: async (
        query: { supplierId?: string; limit?: number; offset?: number } = {},
    ): Promise<ISupplierPaymentsListResponse> => {
        const response = await api.get<
            IApiResponse<ISupplierPaymentsListResponse>
        >('/purchases/payments', { params: query });
        return response.data.data;
    },

    /** `POST /purchases/payments` — bill-by-bill settlement. */
    createPayment: async (
        payload: ISupplierPaymentPayload,
    ): Promise<ISupplierPayment> => {
        const response = await api.post<IApiResponse<ISupplierPayment>>(
            '/purchases/payments',
            payload,
        );
        return response.data.data;
    },

    /** `GET /purchases/reports/outstanding` */
    getOutstanding: async (): Promise<IPayablesOutstandingRow[]> => {
        const response = await api.get<
            IApiResponse<IPayablesOutstandingRow[]>
        >('/purchases/reports/outstanding');
        return response.data.data;
    },

    /** `GET /purchases/reports/ageing` */
    getAgeing: async (): Promise<IPayablesAgeingRow[]> => {
        const response = await api.get<IApiResponse<IPayablesAgeingRow[]>>(
            '/purchases/reports/ageing',
        );
        return response.data.data;
    },

    /** `GET /purchases/orders` */
    listOrders: async (
        query: {
            supplierId?: string;
            status?: PurchaseOrderStatus;
            limit?: number;
            offset?: number;
        } = {},
    ): Promise<IPurchaseOrdersListResponse> => {
        const response = await api.get<
            IApiResponse<IPurchaseOrdersListResponse>
        >('/purchases/orders', { params: query });
        return response.data.data;
    },

    /** `POST /purchases/orders` */
    createOrder: async (
        payload: IPurchaseOrderPayload,
    ): Promise<IPurchaseOrder> => {
        const response = await api.post<IApiResponse<IPurchaseOrder>>(
            '/purchases/orders',
            payload,
        );
        return response.data.data;
    },

    /** `PATCH /purchases/orders/:id/send` */
    sendOrder: async (id: string): Promise<IPurchaseOrder> => {
        const response = await api.patch<IApiResponse<IPurchaseOrder>>(
            `/purchases/orders/${id}/send`,
        );
        return response.data.data;
    },

    /** `PATCH /purchases/orders/:id/cancel` */
    cancelOrder: async (id: string): Promise<IPurchaseOrder> => {
        const response = await api.patch<IApiResponse<IPurchaseOrder>>(
            `/purchases/orders/${id}/cancel`,
        );
        return response.data.data;
    },

    /** `GET /purchases/reorder-suggestions` — per-supplier reorder report. */
    reorderSuggestions: async (
        query: {
            branchId?: string;
            leadDays?: number;
            lookbackDays?: number;
        } = {},
    ): Promise<IReorderSuggestionsReport> => {
        const response = await api.get<IApiResponse<IReorderSuggestionsReport>>(
            '/purchases/reorder-suggestions',
            { params: query },
        );
        return response.data.data;
    },

    /** `POST /purchases/reorder-suggestions/draft` — draft one PO per supplier. */
    draftReorders: async (
        orders: IPurchaseOrderPayload[],
    ): Promise<IPurchaseOrder[]> => {
        const response = await api.post<IApiResponse<IPurchaseOrder[]>>(
            '/purchases/reorder-suggestions/draft',
            { orders },
        );
        return response.data.data;
    },

    /** `GET /purchases/returns?grnId=` — debit notes for one GRN. */
    listReturnsForGrn: async (grnId: string): Promise<IPurchaseReturn[]> => {
        const response = await api.get<IApiResponse<IPurchaseReturn[]>>(
            '/purchases/returns',
            { params: { grnId } },
        );
        return response.data.data;
    },

    /** `POST /purchases/returns` — stock out + bill adjustment. */
    createReturn: async (
        payload: IPurchaseReturnPayload,
    ): Promise<IPurchaseReturn> => {
        const response = await api.post<IApiResponse<IPurchaseReturn>>(
            '/purchases/returns',
            payload,
        );
        return response.data.data;
    },
};
