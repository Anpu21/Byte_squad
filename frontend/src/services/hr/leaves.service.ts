import api from '../api';
import type {
    IApiResponse,
    IApplyLeavePayload,
    ILeave,
    ILeavesListResponse,
    LeaveStatus,
} from '@/types';

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

export const hrLeavesService = {
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
};
