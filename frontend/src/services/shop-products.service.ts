import api from './api';
import type { IApiResponse, IShopProduct, IShopBranch } from '@/types';

interface ListProductsParams {
    branchId: string;
    category?: string;
    search?: string;
}

export const shopProductsService = {
    listProducts: async (params: ListProductsParams): Promise<IShopProduct[]> => {
        const response = await api.get<IApiResponse<IShopProduct[]>>('/shop/products', {
            params,
        });
        return response.data.data;
    },

    getCategories: async (): Promise<string[]> => {
        const response = await api.get<IApiResponse<string[]>>(
            '/shop/products/categories',
        );
        return response.data.data;
    },

    getProduct: async (id: string, branchId?: string): Promise<IShopProduct> => {
        const response = await api.get<IApiResponse<IShopProduct>>(
            `/shop/products/${id}`,
            { params: branchId ? { branchId } : {} },
        );
        return response.data.data;
    },

    listBranches: async (): Promise<IShopBranch[]> => {
        const response = await api.get<IApiResponse<IShopBranch[]>>('/shop/branches');
        return response.data.data;
    },
};
