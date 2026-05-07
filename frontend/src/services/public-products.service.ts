import customerApi from './customer-api';
import type { IApiResponse, IPublicProduct, IPublicBranch } from '@/types';

interface ListProductsParams {
    category?: string;
    search?: string;
}

export const publicProductsService = {
    listProducts: async (params: ListProductsParams = {}): Promise<IPublicProduct[]> => {
        const response = await customerApi.get<IApiResponse<IPublicProduct[]>>(
            '/public/products',
            { params },
        );
        return response.data.data;
    },

    getCategories: async (): Promise<string[]> => {
        const response = await customerApi.get<IApiResponse<string[]>>(
            '/public/products/categories',
        );
        return response.data.data;
    },

    getProduct: async (id: string): Promise<IPublicProduct> => {
        const response = await customerApi.get<IApiResponse<IPublicProduct>>(
            `/public/products/${id}`,
        );
        return response.data.data;
    },

    listBranches: async (): Promise<IPublicBranch[]> => {
        const response = await customerApi.get<IApiResponse<IPublicBranch[]>>(
            '/public/branches',
        );
        return response.data.data;
    },
};
