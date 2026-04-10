import api from './api';
import type {
    IApiResponse,
    IOverviewResponse,
    IBranchWithMeta,
    IAdminWithBranch,
    IBranch,
    IBranchCreatePayload,
    IBranchUpdatePayload,
    IUser,
    IUserCreatePayload,
} from '@/types';

export const superAdminService = {
    getOverview: async (): Promise<IOverviewResponse> => {
        const response = await api.get<IApiResponse<IOverviewResponse>>(
            '/super-admin/overview',
        );
        return response.data.data;
    },

    listBranches: async (): Promise<IBranchWithMeta[]> => {
        const response = await api.get<IApiResponse<IBranchWithMeta[]>>(
            '/super-admin/branches',
        );
        return response.data.data;
    },

    listAdmins: async (): Promise<IAdminWithBranch[]> => {
        const response = await api.get<IApiResponse<IAdminWithBranch[]>>(
            '/super-admin/admins',
        );
        return response.data.data;
    },

    // ── Branch mutations (uses existing /branches endpoints) ──────────────

    createBranch: async (payload: IBranchCreatePayload): Promise<IBranch> => {
        const response = await api.post<IApiResponse<IBranch>>(
            '/branches',
            payload,
        );
        return response.data.data;
    },

    updateBranch: async (
        id: string,
        payload: IBranchUpdatePayload,
    ): Promise<IBranch> => {
        const response = await api.patch<IApiResponse<IBranch>>(
            `/branches/${id}`,
            payload,
        );
        return response.data.data;
    },

    toggleBranchActive: async (id: string): Promise<IBranch> => {
        const response = await api.patch<IApiResponse<IBranch>>(
            `/branches/${id}/toggle-active`,
        );
        return response.data.data;
    },

    deleteBranch: async (id: string): Promise<void> => {
        await api.delete(`/branches/${id}`);
    },

    // ── Admin mutations (uses existing /users endpoints) ──────────────────

    createAdmin: async (payload: IUserCreatePayload): Promise<IUser> => {
        const response = await api.post<IApiResponse<IUser>>('/users', payload);
        return response.data.data;
    },

    updateAdmin: async (
        id: string,
        payload: Partial<IUserCreatePayload>,
    ): Promise<IUser> => {
        const response = await api.patch<IApiResponse<IUser>>(
            `/users/${id}`,
            payload,
        );
        return response.data.data;
    },

    deleteAdmin: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`);
    },

    resetAdminPassword: async (id: string): Promise<void> => {
        await api.post(`/users/${id}/reset-password`);
    },
};
