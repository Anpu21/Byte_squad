import api from './api';
import type {
    IApiResponse,
    ISalesmanReportParams,
    ISalesmanReportResponse,
} from '@/types';

/** Sales report client (cashier-wise aggregates). */
export const salesReportsService = {
    /** `GET /pos/reports/salesman` */
    salesman: async (
        params: ISalesmanReportParams,
    ): Promise<ISalesmanReportResponse> => {
        const response = await api.get<IApiResponse<ISalesmanReportResponse>>(
            '/pos/reports/salesman',
            { params },
        );
        return response.data.data;
    },
};
