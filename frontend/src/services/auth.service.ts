import api from './api';
import type { ILoginPayload, IAuthResponse, IApiResponse } from '@/types';

export const authService = {
    login: async (credentials: ILoginPayload): Promise<IAuthResponse> => {
        const response = await api.post<IApiResponse<IAuthResponse>>('/auth/login', credentials);
        return response.data.data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
        const response = await api.post<IApiResponse<{ message: string }>>('/auth/change-password', {
            currentPassword,
            newPassword,
        });
        return response.data.data;
    },
};
