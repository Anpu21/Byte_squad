import api from './api';
import type { IApiResponse, IPaginatedResponse } from '@/types';

export interface IProduct {
  id: string;
  name: string;
  barcode: string;
  description: string | null;
  category: string;
  costPrice: number;
  sellingPrice: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IInventoryItem {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  lowStockThreshold: number;
  lastRestockedAt: string | null;
  updatedAt: string;
  product: IProduct;
}

export interface IProductPayload {
  name: string;
  barcode: string;
  description?: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  imageUrl?: string;
}

export interface IInventoryParams {
  search?: string;
  category?: string;
  stockStatus?: string;
  page?: number;
  limit?: number;
}

export const inventoryService = {
  getByBranch: async (branchId: string, params?: IInventoryParams): Promise<IPaginatedResponse<IInventoryItem>> => {
    const response = await api.get<IApiResponse<IPaginatedResponse<IInventoryItem>>>(
      `/inventory/branch/${branchId}`,
      { params },
    );
    return response.data.data;
  },

  getProducts: async (): Promise<IProduct[]> => {
    const response = await api.get<IApiResponse<IProduct[]>>('/products');
    return response.data.data;
  },

  getProductById: async (id: string): Promise<IProduct> => {
    const response = await api.get<IApiResponse<IProduct>>(`/products/${id}`);
    return response.data.data;
  },

  getProductByBarcode: async (barcode: string): Promise<IProduct | null> => {
    try {
      const response = await api.get<IApiResponse<IProduct>>(`/products/barcode/${barcode}`);
      return response.data.data;
    } catch {
      return null;
    }
  },

  createProduct: async (payload: IProductPayload): Promise<IProduct> => {
    const response = await api.post<IApiResponse<IProduct>>('/products', payload);
    return response.data.data;
  },

  updateProduct: async (id: string, payload: Partial<IProductPayload>): Promise<IProduct> => {
    const response = await api.patch<IApiResponse<IProduct>>(`/products/${id}`, payload);
    return response.data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  createInventory: async (payload: {
    productId: string;
    branchId: string;
    quantity: number;
    lowStockThreshold?: number;
  }): Promise<IInventoryItem> => {
    const response = await api.post<IApiResponse<IInventoryItem>>('/inventory', payload);
    return response.data.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get<IApiResponse<string[]>>('/products/categories');
    return response.data.data;
  },
};
