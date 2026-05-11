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

  // ── Branch mutations (uses existing /branches endpoints) ──────────────

  createBranch: async (payload: IBranchCreatePayload): Promise<IBranch> => {
    const response = await api.post<IApiResponse<IBranch>>(
      '/branches',
      payload,
    )
    return response.data.data
  },

  updateBranch: async (
    id: string,
    payload: IBranchUpdatePayload,
  ): Promise<IBranch> => {
    const response = await api.patch<IApiResponse<IBranch>>(
      `/branches/${id}`,
      payload,
    )
    return response.data.data
  },

  toggleBranchActive: async (id: string): Promise<IBranch> => {
    const response = await api.patch<IApiResponse<IBranch>>(
      `/branches/${id}/toggle-active`,
    )
    return response.data.data
  },

  deleteBranch: async (id: string): Promise<void> => {
    await api.delete(`/branches/${id}`)
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
