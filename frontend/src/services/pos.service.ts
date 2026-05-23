import api from './api';
import type {
  IApiResponse,
  ISearchProductRow,
  IProductUnitRow,
  IInventoryQuantity,
  ISale,
  IRecentSaleRow,
  IInvoiceNumberResponse,
  ICreateSalePayload,
  ICustomerSearchRow,
} from '@/types';

/**
 * Result shape for `GET /pos/products/:productId/units/:unitName/base-qty`.
 * Returned by the backend `getBaseUnitQty` endpoint so the cashier can
 * convert the typed quantity into the canonical base unit before stock
 * decrement.
 */
export interface IBaseUnitQtyResponse {
  conversionToBase: number;
  isBase: boolean;
}

export const posService = {
  searchProducts: async (
    q: string,
    limit = 10,
  ): Promise<ISearchProductRow[]> => {
    const response = await api.get<IApiResponse<ISearchProductRow[]>>(
      '/pos/products/search',
      { params: { q, limit } },
    );
    return response.data.data;
  },

  listProductUnits: async (productId: string): Promise<IProductUnitRow[]> => {
    const response = await api.get<IApiResponse<IProductUnitRow[]>>(
      `/pos/products/${productId}/units`,
    );
    return response.data.data;
  },

  getBaseUnitQty: async (
    productId: string,
    unitName: string,
  ): Promise<IBaseUnitQtyResponse> => {
    const response = await api.get<IApiResponse<IBaseUnitQtyResponse>>(
      `/pos/products/${productId}/units/${encodeURIComponent(unitName)}/base-qty`,
    );
    return response.data.data;
  },

  getProductInventory: async (
    productId: string,
  ): Promise<IInventoryQuantity> => {
    const response = await api.get<IApiResponse<IInventoryQuantity>>(
      `/pos/products/${productId}/inventory`,
    );
    return response.data.data;
  },

  getRecentSales: async (limit = 10): Promise<IRecentSaleRow[]> => {
    const response = await api.get<IApiResponse<IRecentSaleRow[]>>(
      '/pos/recent-sales',
      { params: { limit } },
    );
    return response.data.data;
  },

  previewInvoiceNumber: async (): Promise<IInvoiceNumberResponse> => {
    const response = await api.get<IApiResponse<IInvoiceNumberResponse>>(
      '/pos/invoice-number',
    );
    return response.data.data;
  },

  createSale: async (
    payload: ICreateSalePayload,
    idempotencyKey?: string,
  ): Promise<ISale> => {
    const config = idempotencyKey
      ? { headers: { 'X-Idempotency-Key': idempotencyKey } }
      : undefined;
    const response = await api.post<IApiResponse<ISale>>(
      '/pos/sales',
      payload,
      config,
    );
    return response.data.data;
  },

  markPrinted: async (saleId: string): Promise<ISale> => {
    const response = await api.patch<IApiResponse<ISale>>(
      `/pos/sales/${saleId}/print`,
    );
    return response.data.data;
  },

  findSaleById: async (saleId: string): Promise<ISale | null> => {
    const response = await api.get<IApiResponse<ISale | null>>(
      `/pos/transactions/${saleId}`,
    );
    return response.data.data;
  },

  voidSale: async (saleId: string, reason: string): Promise<ISale> => {
    const response = await api.post<IApiResponse<ISale>>(
      `/pos/sales/${saleId}/void`,
      { reason },
    );
    return response.data.data;
  },

  searchCustomers: async (
    q: string,
    limit = 10,
  ): Promise<ICustomerSearchRow[]> => {
    const response = await api.get<IApiResponse<ICustomerSearchRow[]>>(
      '/pos/customers/search',
      { params: { q, limit } },
    );
    return response.data.data;
  },
};
