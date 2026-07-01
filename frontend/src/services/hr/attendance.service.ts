import api from '../api';
import type {
    IApiResponse,
    IAttendance,
    IAttendanceListResponse,
    IBulkAttendancePayload,
    ITodayAttendanceStatus,
} from '@/types';

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

export const hrAttendanceService = {
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
};
