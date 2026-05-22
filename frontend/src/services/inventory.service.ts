import api from './api'
import type {
  IApiResponse,
  IPaginatedResponse,
  IProduct,
  IInventoryWithProduct,
  IProductPayload,
  IInventoryParams,
} from '@/types'

// Re-export for backward compatibility — older callers used IInventoryItem.
export type IInventoryItem = IInventoryWithProduct

export const inventoryService = {
  getByBranch: async (
    branchId: string,
    params?: IInventoryParams,
    options?: { signal?: AbortSignal },
  ): Promise<IPaginatedResponse<IInventoryWithProduct>> => {
    const response = await api.get<IApiResponse<IPaginatedResponse<IInventoryWithProduct>>>(
      `/inventory/branch/${branchId}`,
      { params, signal: options?.signal },
    )
    return response.data.data
  },

  getProducts: async (): Promise<IProduct[]> => {
    const response = await api.get<IApiResponse<IProduct[]>>('/products')
    return response.data.data
  },

  getProductById: async (id: string): Promise<IProduct> => {
    const response = await api.get<IApiResponse<IProduct>>(`/products/${id}`)
    return response.data.data
  },

  getProductByBarcode: async (barcode: string): Promise<IProduct | null> => {
    try {
      const response = await api.get<IApiResponse<IProduct>>(`/products/barcode/${barcode}`)
      return response.data.data
    } catch {
      return null
    }
  },

  createProduct: async (payload: IProductPayload): Promise<IProduct> => {
    const response = await api.post<IApiResponse<IProduct>>('/products', payload)
    return response.data.data
  },

  updateProduct: async (id: string, payload: Partial<IProductPayload>): Promise<IProduct> => {
    const response = await api.patch<IApiResponse<IProduct>>(`/products/${id}`, payload)
    return response.data.data
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`)
  },

  uploadProductImage: async (id: string, file: File): Promise<IProduct> => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await api.post<IApiResponse<IProduct>>(
      `/products/${id}/image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return response.data.data
  },

  deleteProductImage: async (id: string): Promise<IProduct> => {
    const response = await api.delete<IApiResponse<IProduct>>(
      `/products/${id}/image`,
    )
    return response.data.data
  },

  createInventory: async (payload: {
    productId: string
    branchId: string
    quantity: number
    lowStockThreshold?: number
  }): Promise<IInventoryWithProduct> => {
    const response = await api.post<IApiResponse<IInventoryWithProduct>>('/inventory', payload)
    return response.data.data
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get<IApiResponse<string[]>>('/products/categories')
    return response.data.data
  },
}
