import api from './api';
import type {
    IApiResponse,
    IApplyLeavePayload,
    IAttendance,
    IAttendanceListResponse,
    IBulkAttendancePayload,
    IEmployee,
    IEmployeePayload,
    IEmployeesListResponse,
    IGeneratePayrollResponse,
    ILeave,
    ILeavesListResponse,
    IPayroll,
    IPayrollListResponse,
    ITodayAttendanceStatus,
    LeaveStatus,
    PaymentMethod,
    PayrollStatus,
} from '@/types';

export interface IListEmployeesQuery {
    branchId?: string;
    search?: string;
    status?: 'Active' | 'Resigned' | 'Terminated' | 'OnLeave';
    limit?: number;
    offset?: number;
}

export interface ITerminateEmployeePayload {
    /** ISO date `YYYY-MM-DD` — payroll cut-off. */
    terminationDate: string;
    /** Free-text reason (BE requires `MinLength(3)`). */
    reason: string;
}

export interface IListLeavesQuery {
    branchId?: string;
    employeeId?: string;
    status?: LeaveStatus;
    /** ISO date `YYYY-MM-DD`. */
    startDate?: string;
    /** ISO date `YYYY-MM-DD`. */
    endDate?: string;
    limit?: number;
    offset?: number;
}

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
    bankReferenceNo?: string;
}

export interface IExportPayrollCsvQuery {
    month: number;
    year: number;
    branchId?: string;
}

export interface IListAttendanceQuery {
    /** Admin only — managers are pinned to their own branch server-side. */
    branchId?: string;
    /** Narrow to a single employee (employee-profile view). */
    employeeId?: string;
    /** ISO date `YYYY-MM-DD`, inclusive. */
    startDate: string;
    /** ISO date `YYYY-MM-DD`, inclusive. */
    endDate: string;
}

/**
 * HR API client. The BE filters list / read endpoints by
 * `actor.branchId` for non-admins server-side, so the FE only needs
 * to pass through whatever filter chips the user picked — branch
 * scope cannot be widened from the URL.
 */
export const hrService = {
    listEmployees: async (
        query: IListEmployeesQuery = {},
    ): Promise<IEmployeesListResponse> => {
        const response = await api.get<IApiResponse<IEmployeesListResponse>>(
            '/hr/employees',
            { params: query },
        );
        return response.data.data;
    },

    getEmployee: async (id: string): Promise<IEmployee> => {
        const response = await api.get<IApiResponse<IEmployee>>(
            `/hr/employees/${id}`,
        );
        return response.data.data;
    },

    createEmployee: async (payload: IEmployeePayload): Promise<IEmployee> => {
        const response = await api.post<IApiResponse<IEmployee>>(
            '/hr/employees',
            payload,
        );
        return response.data.data;
    },

    updateEmployee: async (
        id: string,
        payload: Partial<IEmployeePayload>,
    ): Promise<IEmployee> => {
        const response = await api.patch<IApiResponse<IEmployee>>(
            `/hr/employees/${id}`,
            payload,
        );
        return response.data.data;
    },

    terminateEmployee: async (
        id: string,
        payload: ITerminateEmployeePayload,
    ): Promise<IEmployee> => {
        const response = await api.patch<IApiResponse<IEmployee>>(
            `/hr/employees/${id}/terminate`,
            payload,
        );
        return response.data.data;
    },

    uploadEmployeePhoto: async (
        id: string,
        file: File,
    ): Promise<IEmployee> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<IApiResponse<IEmployee>>(
            `/hr/employees/${id}/photo`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return response.data.data;
    },

    /**
     * `GET /hr/attendance` — date-range scoped, returns `{ rows, total }`.
     * The BE pins managers to `actor.branchId` server-side, so passing
     * a different `branchId` from a manager session is a no-op.
     */
    listAttendance: async (
        query: IListAttendanceQuery,
    ): Promise<IAttendanceListResponse> => {
        const response = await api.get<IApiResponse<IAttendanceListResponse>>(
            '/hr/attendance',
            { params: query },
        );
        return response.data.data;
    },

    /**
     * `GET /hr/attendance/me` — self-scoped attendance for the
     * authenticated worker / cashier. Same date-range envelope as
     * `listAttendance`, but the BE forces the actor's own employee, so
     * `branchId` / `employeeId` are never accepted here.
     */
    getMyAttendance: async (query: {
        startDate: string;
        endDate: string;
    }): Promise<IAttendanceListResponse> => {
        const response = await api.get<IApiResponse<IAttendanceListResponse>>(
            '/hr/attendance/me',
            { params: query },
        );
        return response.data.data;
    },

    /**
     * `GET /hr/attendance/today-status` — branch "who hasn't been recorded
     * today". Admins may pass `branchId`; managers are pinned to their own
     * branch server-side.
     */
    getBranchTodayStatus: async (
        branchId?: string,
    ): Promise<ITodayAttendanceStatus> => {
        const response = await api.get<IApiResponse<ITodayAttendanceStatus>>(
            '/hr/attendance/today-status',
            { params: branchId ? { branchId } : undefined },
        );
        return response.data.data;
    },

    /**
     * `POST /hr/attendance/bulk` — manager grid submit. Capped at
     * 500 rows server-side; persisted inside a single transaction.
     */
    bulkUpsertAttendance: async (
        payload: IBulkAttendancePayload,
    ): Promise<IAttendance[]> => {
        const response = await api.post<IApiResponse<IAttendance[]>>(
            '/hr/attendance/bulk',
            payload,
        );
        return response.data.data;
    },

    /**
     * `POST /hr/attendance/check-in` — cashier self-service. No body;
     * the BE derives the employee from the authenticated actor and the
     * timestamp from the server clock. Rejects on double check-in.
     */
    checkInSelf: async (): Promise<IAttendance> => {
        const response = await api.post<IApiResponse<IAttendance>>(
            '/hr/attendance/check-in',
            {},
        );
        return response.data.data;
    },

    /**
     * `POST /hr/attendance/check-out` — cashier self-service. Same
     * server-derived shape as check-in. Rejects if there is no
     * matching check-in for today.
     */
    checkOutSelf: async (): Promise<IAttendance> => {
        const response = await api.post<IApiResponse<IAttendance>>(
            '/hr/attendance/check-out',
            {},
        );
        return response.data.data;
    },

    /**
     * `GET /hr/leaves` — branch-scoped on the server. Cashiers are
     * pinned to their own employee regardless of `employeeId`.
     */
    listLeaves: async (
        query: IListLeavesQuery = {},
    ): Promise<ILeavesListResponse> => {
        const response = await api.get<IApiResponse<ILeavesListResponse>>(
            '/hr/leaves',
            { params: query },
        );
        return response.data.data;
    },

    /**
     * `POST /hr/leaves` — apply for a new leave. Cashiers can only
     * apply for themselves (the BE overrides `employeeId`).
     */
    applyLeave: async (payload: IApplyLeavePayload): Promise<ILeave> => {
        const response = await api.post<IApiResponse<ILeave>>(
            '/hr/leaves',
            payload,
        );
        return response.data.data;
    },

    /** `PATCH /hr/leaves/:id/approve` — manager/admin only. */
    approveLeave: async (id: string): Promise<ILeave> => {
        const response = await api.patch<IApiResponse<ILeave>>(
            `/hr/leaves/${id}/approve`,
        );
        return response.data.data;
    },

    /** `PATCH /hr/leaves/:id/reject` — manager/admin only. */
    rejectLeave: async (
        id: string,
        rejectionReason: string,
    ): Promise<ILeave> => {
        const response = await api.patch<IApiResponse<ILeave>>(
            `/hr/leaves/${id}/reject`,
            { rejectionReason },
        );
        return response.data.data;
    },

    /** `PATCH /hr/leaves/:id/cancel` — cashiers self-cancel Pending only. */
    cancelLeave: async (id: string): Promise<ILeave> => {
        const response = await api.patch<IApiResponse<ILeave>>(
            `/hr/leaves/${id}/cancel`,
        );
        return response.data.data;
    },

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
