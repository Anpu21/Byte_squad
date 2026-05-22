import api from './api';
import type {
  IUser,
  IUserCreatePayload,
  IUserUpdatePayload,
  IUserActionRequestResponse,
  IUserActionConfirmResponse,
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

  // ── Two-step admin mutations: request → confirm OTP ───────────────────
  // POST/PATCH/DELETE on /users now return a pending-action id + expiresAt.
  // The admin must follow up with POST /users/actions/:actionId/confirm
  // carrying the 6-digit OTP they received by email.

  requestCreate: async (
    payload: IUserCreatePayload,
  ): Promise<IUserActionRequestResponse> => {
    const response = await api.post<
      IApiResponse<IUserActionRequestResponse>
    >('/users', payload);
    return response.data.data;
  },

  requestUpdate: async (
    id: string,
    payload: IUserUpdatePayload,
  ): Promise<IUserActionRequestResponse> => {
    const response = await api.patch<
      IApiResponse<IUserActionRequestResponse>
    >(`/users/${id}`, payload);
    return response.data.data;
  },

  requestDelete: async (id: string): Promise<IUserActionRequestResponse> => {
    const response = await api.delete<
      IApiResponse<IUserActionRequestResponse>
    >(`/users/${id}`);
    return response.data.data;
  },

  requestResetPassword: async (
    id: string,
  ): Promise<IUserActionRequestResponse> => {
    const response = await api.post<
      IApiResponse<IUserActionRequestResponse>
    >(`/users/${id}/reset-password`);
    return response.data.data;
  },

  confirmUserAction: async (
    actionId: string,
    otpCode: string,
  ): Promise<IUserActionConfirmResponse> => {
    const response = await api.post<
      IApiResponse<IUserActionConfirmResponse>
    >(`/users/actions/${actionId}/confirm`, { otpCode });
    return response.data.data;
  },

  resendUserActionOtp: async (
    actionId: string,
  ): Promise<{ expiresAt: string }> => {
    const response = await api.post<IApiResponse<{ expiresAt: string }>>(
      `/users/actions/${actionId}/resend`,
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
