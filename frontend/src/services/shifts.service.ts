import api from './api';
import type {
    IApiResponse,
    ICurrentShiftResponse,
    IPosShift,
} from '@/types';

/** Drawer-session client (open/close + live summary). */
export const shiftsService = {
    /** `GET /pos/shifts/current` */
    current: async (): Promise<ICurrentShiftResponse> => {
        const response = await api.get<IApiResponse<ICurrentShiftResponse>>(
            '/pos/shifts/current',
        );
        return response.data.data;
    },

    /** `POST /pos/shifts/open` */
    open: async (openingFloat: number): Promise<IPosShift> => {
        const response = await api.post<IApiResponse<IPosShift>>(
            '/pos/shifts/open',
            { openingFloat },
        );
        return response.data.data;
    },

    /** `POST /pos/shifts/close` — snapshots the Z-report numbers. */
    close: async (
        countedCash: number,
        notes?: string,
    ): Promise<IPosShift> => {
        const response = await api.post<IApiResponse<IPosShift>>(
            '/pos/shifts/close',
            { countedCash, notes },
        );
        return response.data.data;
    },
};
