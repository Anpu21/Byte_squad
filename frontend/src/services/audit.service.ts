import api from './api';
import type { IApiResponse, IAuditLogsResponse } from '@/types';

export interface IListAuditLogsQuery {
    userId?: string;
    method?: string;
    search?: string;
    /** ISO date `YYYY-MM-DD`. */
    startDate?: string;
    /** ISO date `YYYY-MM-DD`. */
    endDate?: string;
    limit?: number;
    offset?: number;
}

/** Activity-log client (admin only). */
export const auditService = {
    /** `GET /audit/logs` */
    list: async (
        query: IListAuditLogsQuery = {},
    ): Promise<IAuditLogsResponse> => {
        const response = await api.get<IApiResponse<IAuditLogsResponse>>(
            '/audit/logs',
            { params: query },
        );
        return response.data.data;
    },
};
