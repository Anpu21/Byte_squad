import api from './api';
import type {
    IApiResponse,
    ICashMovement,
    ICashMovementPayload,
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

    /** `POST /pos/shifts/movements` — record a drawer pay-in / pay-out. */
    recordCashMovement: async (
        payload: ICashMovementPayload,
    ): Promise<ICurrentShiftResponse> => {
        const response = await api.post<IApiResponse<ICurrentShiftResponse>>(
            '/pos/shifts/movements',
            payload,
        );
        return response.data.data;
    },

    /** `GET /pos/shifts/movements` — movements for the open shift. */
    cashMovements: async (): Promise<ICashMovement[]> => {
        const response = await api.get<IApiResponse<ICashMovement[]>>(
            '/pos/shifts/movements',
        );
        return response.data.data;
    },
};
