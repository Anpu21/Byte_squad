import api from './api';
import type {
    ILoginPayload,
    IAuthResponse,
    IApiResponse,
    ISignupPayload,
    IVerifyOtpPayload,
} from '@/types';

export const authService = {
    login: async (credentials: ILoginPayload): Promise<IAuthResponse> => {
        const response = await api.post<IApiResponse<IAuthResponse>>('/auth/login', credentials);
        return response.data.data;
    },

    signup: async (payload: ISignupPayload): Promise<{ userId: string }> => {
        const response = await api.post<IApiResponse<{ userId: string }>>('/auth/signup', payload);
        return response.data.data;
    },

    verifyOtp: async (payload: IVerifyOtpPayload): Promise<{ message: string }> => {
        const response = await api.post<IApiResponse<{ message: string }>>('/auth/verify-otp', payload);
        return response.data.data;
    },

    resendOtp: async (email: string): Promise<{ message: string }> => {
        const response = await api.post<IApiResponse<{ message: string }>>('/auth/resend-otp', { email });
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
