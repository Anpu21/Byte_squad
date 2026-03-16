import api from './api';
import type { IApiResponse, IUserProfile } from '@/types';

export const profileService = {
    getProfile: async (): Promise<IUserProfile> => {
        const response = await api.get<IApiResponse<IUserProfile>>('/users/profile');
        return response.data.data;
    },

    updateProfile: async (data: { firstName?: string; lastName?: string }): Promise<IUserProfile> => {
        const response = await api.patch<IApiResponse<IUserProfile>>('/users/profile', data);
        return response.data.data;
    },

    uploadAvatar: async (file: File): Promise<IUserProfile> => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.post<IApiResponse<IUserProfile>>('/users/profile/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    },
};
