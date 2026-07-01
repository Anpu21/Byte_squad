import api from '../api';
import type {
    IApiResponse,
    IGeneratePayrollResponse,
    IPayroll,
    IPayrollListResponse,
    PaymentMethod,
    PayrollStatus,
} from '@/types';

export interface IGeneratePayrollPayload {
    month: number;
    year: number;
    branchId?: string;
}

export interface IListPayrollQuery {
    branchId?: string;
    employeeId?: string;
    month?: number;
    year?: number;
    status?: PayrollStatus;
    limit?: number;
    offset?: number;
}

export interface IMarkPayrollPaidPayload {
    /** ISO date `YYYY-MM-DD`. */
    paymentDate: string;
    paymentMethod: PaymentMethod;
    /** Optional disbursement reference (e.g. card terminal / transfer ref). */
    paymentReference?: string;
}

export interface IExportPayrollCsvQuery {
    month: number;
    year: number;
    branchId?: string;
}

export const hrPayrollService = {
    /**
     * `GET /hr/payroll` — manager/admin only. The BE pins managers to
     * their own branch regardless of the `branchId` query param.
     */
    listPayroll: async (
        query: IListPayrollQuery = {},
    ): Promise<IPayrollListResponse> => {
        const response = await api.get<IApiResponse<IPayrollListResponse>>(
            '/hr/payroll',
            { params: query },
        );
        return response.data.data;
    },

    getPayroll: async (id: string): Promise<IPayroll> => {
        const response = await api.get<IApiResponse<IPayroll>>(
            `/hr/payroll/${id}`,
        );
        return response.data.data;
    },

    /**
     * `POST /hr/payroll/generate` — runs the full branch payroll for
     * the (month, year). Returns generated rows alongside per-employee
     * `skipped` warnings (e.g. no active salary structure).
     */
    generatePayroll: async (
        payload: IGeneratePayrollPayload,
    ): Promise<IGeneratePayrollResponse> => {
        const response = await api.post<IApiResponse<IGeneratePayrollResponse>>(
            '/hr/payroll/generate',
            payload,
        );
        return response.data.data;
    },

    approvePayroll: async (id: string): Promise<IPayroll> => {
        const response = await api.patch<IApiResponse<IPayroll>>(
            `/hr/payroll/${id}/approve`,
        );
        return response.data.data;
    },

    markPayrollPaid: async (
        id: string,
        payload: IMarkPayrollPaidPayload,
    ): Promise<IPayroll> => {
        const response = await api.patch<IApiResponse<IPayroll>>(
            `/hr/payroll/${id}/mark-paid`,
            payload,
        );
        return response.data.data;
    },

    cancelPayroll: async (id: string): Promise<IPayroll> => {
        const response = await api.patch<IApiResponse<IPayroll>>(
            `/hr/payroll/${id}/cancel`,
        );
        return response.data.data;
    },

    /**
     * `GET /hr/payroll/csv?month=&year=&branchId=` — bank-file export.
     * Returned as a Blob so the caller can trigger a download via an
     * object URL without buffering through state.
     */
    exportPayrollCsv: async (
        query: IExportPayrollCsvQuery,
    ): Promise<Blob> => {
        const response = await api.get<Blob>('/hr/payroll/csv', {
            params: query,
            responseType: 'blob',
        });
        return response.data;
    },
};
