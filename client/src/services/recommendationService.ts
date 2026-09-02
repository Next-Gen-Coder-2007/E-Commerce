import api from './api';
import { Product } from '../types/product';

export interface RecommendedProduct extends Product {
  recommendationScore?: number;
  matchReason?: string;
  hybridScore?: number;
  semanticRelevance?: number;
}

export interface FrequentlyBoughtTogetherResponse {
  mainProduct: Product;
  bundleItems: Array<Product & { bundleDiscountPrice: number }>;
  rawTotal: number;
  bundlePrice: number;
  savings: number;
  bundleDiscountPct: number;
}

export const getForYouRecommendationsApi = async (params?: {
  wishlist?: string[];
  cart?: string[];
  categories?: string[];
  limit?: number;
}): Promise<RecommendedProduct[]> => {
  const queryParams: Record<string, any> = {};
  if (params?.wishlist?.length) queryParams.wishlist = params.wishlist.join(',');
  if (params?.cart?.length) queryParams.cart = params.cart.join(',');
  if (params?.categories?.length) queryParams.categories = params.categories.join(',');
  if (params?.limit) queryParams.limit = params.limit;

  const res = await api.get('/api/products/recommendations/for-you', { params: queryParams });
  return res.data?.data?.recommendations || [];
};

export const getFrequentlyBoughtTogetherApi = async (
  productId: string,
  limit: number = 2
): Promise<FrequentlyBoughtTogetherResponse> => {
  const res = await api.get(`/api/products/recommendations/frequently-bought-together/${productId}`, {
    params: { limit },
  });
  return res.data?.data || res.data;
};

export const executeSemanticHybridSearchApi = async (
  query: string,
  limit: number = 12
): Promise<RecommendedProduct[]> => {
  const res = await api.get('/api/products/recommendations/semantic-hybrid', {
    params: { q: query, limit },
  });
  return res.data?.data?.results || [];
};
