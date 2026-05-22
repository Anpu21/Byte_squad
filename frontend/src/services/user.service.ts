import api from './api';
import type {
  IUser,
  IUserCreatePayload,
  IUserUpdatePayload,
  IApiResponse,
  IBranch,
} from '@/types';

export const userService = {
  getAll: async (): Promise<IUser[]> => {
    const response = await api.get<IApiResponse<IUser[]>>('/users');
    return response.data.data;
  },

  getById: async (id: string): Promise<IUser> => {
    const response = await api.get<IApiResponse<IUser>>(`/users/${id}`);
    return response.data.data;
  },

  // ── Admin mutations (direct, no OTP) ──────────────────────────────────

  create: async (payload: IUserCreatePayload): Promise<IUser> => {
    const response = await api.post<IApiResponse<IUser>>('/users', payload);
    return response.data.data;
  },

  update: async (id: string, payload: IUserUpdatePayload): Promise<IUser> => {
    const response = await api.patch<IApiResponse<IUser>>(
      `/users/${id}`,
      payload,
    );
    return response.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  resetPassword: async (id: string): Promise<IUser> => {
    const response = await api.post<IApiResponse<IUser>>(
      `/users/${id}/reset-password`,
    );
    return response.data.data;
  },

  // ── Branches (used by user-management filters) ────────────────────────

  getBranches: async (): Promise<IBranch[]> => {
    const response = await api.get<IApiResponse<IBranch[]>>('/branches');
    return response.data.data;
  },

  updateMyBranch: async (branchId: string): Promise<IUser> => {
    const response = await api.patch<IApiResponse<IUser>>('/users/me/branch', {
      branchId,
    });
    return response.data.data;
  },
};
