import api from './api'
import type {
  IApiResponse,
  IOverviewResponse,
  IBranchWithMeta,
  IAdminWithBranch,
  IUserWithBranch,
  IBranch,
  IBranchCreatePayload,
  IBranchUpdatePayload,
  IBranchActionRequestResponse,
  IBranchActionConfirmResponse,
  IUser,
  IUserCreatePayload,
  IBranchComparisonRequest,
  IBranchComparisonResponse,
  IInventoryMatrixResponse,
  IInventoryMatrixParams,
} from '@/types'

export const adminService = {
  getOverview: async (): Promise<IOverviewResponse> => {
    const response = await api.get<IApiResponse<IOverviewResponse>>(
      '/admin/overview',
    )
    return response.data.data
  },

  listBranches: async (): Promise<IBranchWithMeta[]> => {
    const response = await api.get<IApiResponse<IBranchWithMeta[]>>(
      '/admin/branches',
    )
    return response.data.data
  },

  listAdmins: async (): Promise<IAdminWithBranch[]> => {
    const response = await api.get<IApiResponse<IAdminWithBranch[]>>(
      '/admin/admins',
    )
    return response.data.data
  },

  listAllUsers: async (): Promise<IUserWithBranch[]> => {
    const response = await api.get<IApiResponse<IUserWithBranch[]>>(
      '/admin/users',
    )
    return response.data.data
  },

  compareBranches: async (
    payload: IBranchComparisonRequest,
  ): Promise<IBranchComparisonResponse> => {
    const response = await api.post<IApiResponse<IBranchComparisonResponse>>(
      '/admin/comparison',
      payload,
    )
    return response.data.data
  },

  getInventoryMatrix: async (
    params?: IInventoryMatrixParams,
  ): Promise<IInventoryMatrixResponse> => {
    const response = await api.get<IApiResponse<IInventoryMatrixResponse>>(
      '/admin/inventory/matrix',
      { params },
    )
    return response.data.data
  },

  // ── Branch mutations (two-step: request → confirm OTP) ────────────────
  // POST /branches, PATCH /branches/:id, DELETE /branches/:id now return a
  // pending-action id + expiresAt. The admin must follow up with
  // POST /branches/actions/:actionId/confirm carrying the 6-digit OTP they
  // received by email.

  requestCreateBranch: async (
    payload: IBranchCreatePayload,
  ): Promise<IBranchActionRequestResponse> => {
    const response = await api.post<
      IApiResponse<IBranchActionRequestResponse>
    >('/branches', payload)
    return response.data.data
  },

  requestUpdateBranch: async (
    id: string,
    payload: IBranchUpdatePayload,
  ): Promise<IBranchActionRequestResponse> => {
    const response = await api.patch<
      IApiResponse<IBranchActionRequestResponse>
    >(`/branches/${id}`, payload)
    return response.data.data
  },

  requestDeleteBranch: async (
    id: string,
  ): Promise<IBranchActionRequestResponse> => {
    const response = await api.delete<
      IApiResponse<IBranchActionRequestResponse>
    >(`/branches/${id}`)
    return response.data.data
  },

  confirmBranchAction: async (
    actionId: string,
    otpCode: string,
  ): Promise<IBranchActionConfirmResponse> => {
    const response = await api.post<
      IApiResponse<IBranchActionConfirmResponse>
    >(`/branches/actions/${actionId}/confirm`, { otpCode })
    return response.data.data
  },

  resendBranchActionOtp: async (
    actionId: string,
  ): Promise<{ expiresAt: string }> => {
    const response = await api.post<IApiResponse<{ expiresAt: string }>>(
      `/branches/actions/${actionId}/resend`,
    )
    return response.data.data
  },

  toggleBranchActive: async (id: string): Promise<IBranch> => {
    const response = await api.patch<IApiResponse<IBranch>>(
      `/branches/${id}/toggle-active`,
    )
    return response.data.data
  },

  // ── User mutations (uses existing /users endpoints) ──────────────

  createUser: async (payload: IUserCreatePayload): Promise<IUser> => {
    const response = await api.post<IApiResponse<IUser>>('/users', payload)
    return response.data.data
  },

  updateUser: async (
    id: string,
    payload: Partial<IUserCreatePayload>,
  ): Promise<IUser> => {
    const response = await api.patch<IApiResponse<IUser>>(
      `/users/${id}`,
      payload,
    )
    return response.data.data
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },

  resetUserPassword: async (id: string): Promise<void> => {
    await api.post(`/users/${id}/reset-password`)
  },
}
