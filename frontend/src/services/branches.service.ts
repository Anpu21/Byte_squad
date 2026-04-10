import api from './api';
import type { IApiResponse, IMyBranchPerformance } from '@/types';

export const branchesService = {
    getMyPerformance: async (): Promise<IMyBranchPerformance> => {
        const response = await api.get<IApiResponse<IMyBranchPerformance>>(
            '/branches/my-performance',
        );
        return response.data.data;
    },
};
