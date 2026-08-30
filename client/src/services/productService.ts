import api from './api';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductFilterParams,
  ProductsResponse,
  CompanyStats,
} from '../types/product';

export const getProductsApi = async (
  params?: ProductFilterParams
): Promise<ProductsResponse> => {
  const response = await api.get<ProductsResponse>('/products', { params });
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
