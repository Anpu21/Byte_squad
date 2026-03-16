import api from './api';
import type { IUser, IUserCreatePayload, IApiResponse, IBranch } from '@/types';

export const userService = {
  getAll: async (): Promise<IUser[]> => {
    const response = await api.get<IApiResponse<IUser[]>>('/users');
    return response.data.data;
  },

  getById: async (id: string): Promise<IUser> => {
    const response = await api.get<IApiResponse<IUser>>(`/users/${id}`);
    return response.data.data;
  },

  create: async (payload: IUserCreatePayload): Promise<IUser> => {
    const response = await api.post<IApiResponse<IUser>>('/users', payload);
    return response.data.data;
  },

  update: async (id: string, payload: Partial<IUserCreatePayload>): Promise<IUser> => {
    const response = await api.patch<IApiResponse<IUser>>(`/users/${id}`, payload);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  resendCredentials: async (id: string): Promise<void> => {
    await api.post(`/users/${id}/resend-credentials`);
  },

  getBranches: async (): Promise<IBranch[]> => {
    const response = await api.get<IApiResponse<IBranch[]>>('/branches');
    return response.data.data;
  },
};
