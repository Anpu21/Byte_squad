import api from './api';
import type { ILoginPayload, IAuthResponse, IApiResponse } from '@/types';

export const authService = {
    login: async (credentials: ILoginPayload): Promise<IAuthResponse> => {
        const response = await api.post<IApiResponse<IAuthResponse>>('/auth/login', credentials);
        return response.data.data;
    },
};
