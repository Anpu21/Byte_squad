import api from './api';
import type { IApiResponse } from '@/types';
import type { IProduct } from './inventory.service';
import type { TransferStatus } from '@/constants/enums';

export interface ITransferUserSummary {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    branchId: string;
}

export interface ITransferBranchSummary {
    id: string;
    name: string;
    address: string;
    phone: string;
    isActive: boolean;
}

export interface IStockTransferRequest {
    id: string;
    productId: string;
    product: IProduct;
    destinationBranchId: string;
    destinationBranch: ITransferBranchSummary;
    sourceBranchId: string | null;
    sourceBranch: ITransferBranchSummary | null;
    requestedQuantity: number;
    approvedQuantity: number | null;
    status: TransferStatus;
    requestReason: string | null;
    rejectionReason: string | null;
    approvalNote: string | null;
    requestedByUserId: string;
    requestedBy: ITransferUserSummary;
    reviewedByUserId: string | null;
    reviewedBy: ITransferUserSummary | null;
    reviewedAt: string | null;
    shippedByUserId: string | null;
    shippedBy: ITransferUserSummary | null;
    shippedAt: string | null;
    receivedByUserId: string | null;
    receivedBy: ITransferUserSummary | null;
    receivedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ITransferSourceOption {
    branchId: string;
    branchName: string;
    isActive: boolean;
    currentQuantity: number;
    lowStockThreshold: number | null;
}

export interface IPaginatedTransfers {
    items: IStockTransferRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ICreateTransferPayload {
    productId: string;
    requestedQuantity: number;
    requestReason?: string;
}

export interface IApproveTransferPayload {
    sourceBranchId: string;
    approvedQuantity: number;
    approvalNote?: string;
}

export interface IListTransfersParams {
    status?: TransferStatus;
    destinationBranchId?: string;
    sourceBranchId?: string;
    page?: number;
    limit?: number;
}

export interface IListTransferHistoryParams {
    status?: TransferStatus[];
    from?: string;
    to?: string;
    productId?: string;
    branchId?: string;
    page?: number;
    limit?: number;
}

export const stockTransfersService = {
    create: async (
        payload: ICreateTransferPayload,
    ): Promise<IStockTransferRequest> => {
        const response = await api.post<IApiResponse<IStockTransferRequest>>(
            '/stock-transfers',
            payload,
        );
        return response.data.data;
    },

    listAll: async (
        params?: IListTransfersParams,
    ): Promise<IPaginatedTransfers> => {
        const response = await api.get<IApiResponse<IPaginatedTransfers>>(
            '/stock-transfers',
            { params },
        );
        return response.data.data;
    },

    listMyRequests: async (
        params?: IListTransfersParams,
    ): Promise<IPaginatedTransfers> => {
        const response = await api.get<IApiResponse<IPaginatedTransfers>>(
            '/stock-transfers/my-requests',
            { params },
        );
        return response.data.data;
    },

    listIncoming: async (
        params?: IListTransfersParams,
    ): Promise<IPaginatedTransfers> => {
        const response = await api.get<IApiResponse<IPaginatedTransfers>>(
            '/stock-transfers/incoming',
            { params },
        );
        return response.data.data;
    },

    getHistory: async (
        params?: IListTransferHistoryParams,
    ): Promise<IPaginatedTransfers> => {
        const response = await api.get<IApiResponse<IPaginatedTransfers>>(
            '/stock-transfers/history',
            { params },
        );
        return response.data.data;
    },

    getById: async (id: string): Promise<IStockTransferRequest> => {
        const response = await api.get<IApiResponse<IStockTransferRequest>>(
            `/stock-transfers/${id}`,
        );
        return response.data.data;
    },

    getSourceOptions: async (
        id: string,
    ): Promise<ITransferSourceOption[]> => {
        const response = await api.get<
            IApiResponse<ITransferSourceOption[]>
        >(`/stock-transfers/${id}/source-options`);
        return response.data.data;
    },

    approve: async (
        id: string,
        payload: IApproveTransferPayload,
    ): Promise<IStockTransferRequest> => {
        const response = await api.patch<IApiResponse<IStockTransferRequest>>(
            `/stock-transfers/${id}/approve`,
            payload,
        );
        return response.data.data;
    },

    reject: async (
        id: string,
        rejectionReason: string,
    ): Promise<IStockTransferRequest> => {
        const response = await api.patch<IApiResponse<IStockTransferRequest>>(
            `/stock-transfers/${id}/reject`,
            { rejectionReason },
        );
        return response.data.data;
    },

    cancel: async (id: string): Promise<IStockTransferRequest> => {
        const response = await api.patch<IApiResponse<IStockTransferRequest>>(
            `/stock-transfers/${id}/cancel`,
        );
        return response.data.data;
    },

    ship: async (id: string): Promise<IStockTransferRequest> => {
        const response = await api.patch<IApiResponse<IStockTransferRequest>>(
            `/stock-transfers/${id}/ship`,
        );
        return response.data.data;
    },

    receive: async (id: string): Promise<IStockTransferRequest> => {
        const response = await api.patch<IApiResponse<IStockTransferRequest>>(
            `/stock-transfers/${id}/receive`,
        );
        return response.data.data;
    },
};
