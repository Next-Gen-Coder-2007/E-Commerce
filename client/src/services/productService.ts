import api from './api';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductFilterParams,
  ProductsResponse,
  CompanyStorefrontResponse,
  StorefrontSettings,
  CompanyStats,
} from '../types/product';

export const getProductsApi = async (
  params?: ProductFilterParams
): Promise<ProductsResponse> => {
  const response = await api.get<ProductsResponse>('/products', { params });
  return response.data;
};

export const getCompanyStorefrontApi = async (
  companyIdentifier: string,
  params?: ProductFilterParams
): Promise<CompanyStorefrontResponse> => {
  const response = await api.get<CompanyStorefrontResponse>(
    `/products/storefront/${encodeURIComponent(companyIdentifier)}`,
    { params }
  );
  return response.data;
};

export const getStorefrontSettingsApi = async (): Promise<{
  success: boolean;
  storefront: StorefrontSettings;
}> => {
  const response = await api.get<{
    success: boolean;
    storefront: StorefrontSettings;
  }>('/products/company/storefront-settings');
  return response.data;
};

export const updateStorefrontSettingsApi = async (
  data: Partial<StorefrontSettings>
): Promise<{
  success: boolean;
  message: string;
  storefront: StorefrontSettings;
}> => {
  const response = await api.put<{
    success: boolean;
    message: string;
    storefront: StorefrontSettings;
  }>('/products/company/storefront-settings', data);
  return response.data;
};

export const applyBulkDiscountApi = async (data: {
  discountPercentage?: number;
  category?: string;
  isFlashSale?: boolean;
  reset?: boolean;
}): Promise<{
  success: boolean;
  message: string;
  updatedCount: number;
}> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    updatedCount: number;
  }>('/products/company/bulk-discount', data);
  return response.data;
};

export const getProductByIdApi = async (
  id: string
): Promise<{ success: boolean; product: Product }> => {
  const response = await api.get<{ success: boolean; product: Product }>(
    `/products/${id}`
  );
  return response.data;
};

export const getCategoriesApi = async (): Promise<{
  success: boolean;
  categories: string[];
}> => {
  const response = await api.get<{ success: boolean; categories: string[] }>(
    '/products/categories'
  );
  return response.data;
};

export const createProductApi = async (
  data: CreateProductInput
): Promise<{ success: boolean; message: string; product: Product }> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    product: Product;
  }>('/products', data);
  return response.data;
};

export const getMyCompanyProductsApi = async (
  params?: { search?: string; category?: string; page?: number; limit?: number }
): Promise<ProductsResponse> => {
  const response = await api.get<ProductsResponse>('/products/company/mine', {
    params,
  });
  return response.data;
};

export const updateProductApi = async (
  id: string,
  data: UpdateProductInput
): Promise<{ success: boolean; message: string; product: Product }> => {
  const response = await api.put<{
    success: boolean;
    message: string;
    product: Product;
  }>(`/products/${id}`, data);
  return response.data;
};

export const deleteProductApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/products/${id}`
  );
  return response.data;
};

export const getCompanyStatsApi = async (): Promise<{
  success: boolean;
  stats: CompanyStats;
}> => {
  const response = await api.get<{ success: boolean; stats: CompanyStats }>(
    '/products/company/stats'
  );
  return response.data;
};

export const uploadProductImageApi = async (
  file: File
): Promise<{ success: boolean; url: string; publicId?: string }> => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post<{
    success: boolean;
    url: string;
    publicId?: string;
  }>('/products/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadMultipleProductImagesApi = async (
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  let completed = 0;

  for (const file of files) {
    const res = await uploadProductImageApi(file);
    if (res.url) {
      urls.push(res.url);
    }
    completed++;
    if (onProgress) {
      onProgress(completed, files.length);
    }
  }

  return urls;
};
