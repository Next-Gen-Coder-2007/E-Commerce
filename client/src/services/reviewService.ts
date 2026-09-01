import api from './api';
import type {
  GetReviewsResponse,
  GetCompanyReviewsResponse,
  Review,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewMerchantReply,
} from '../types/review';

export interface GetReviewsParams {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'highest_rating' | 'lowest_rating' | 'most_helpful' | 'oldest';
  rating?: number;
  withPhotos?: boolean;
  verifiedOnly?: boolean;
}

export interface GetCompanyReviewsParams {
  page?: number;
  limit?: number;
  productId?: string;
  rating?: number;
  replyStatus?: 'all' | 'unreplied' | 'replied';
}

export const getProductReviewsApi = async (
  productId: string,
  params?: GetReviewsParams
): Promise<GetReviewsResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.sort) query.append('sort', params.sort);
  if (params?.rating) query.append('rating', String(params.rating));
  if (params?.withPhotos) query.append('withPhotos', 'true');
  if (params?.verifiedOnly) query.append('verifiedOnly', 'true');

  const queryString = query.toString();
  const url = `/reviews/product/${productId}${queryString ? `?${queryString}` : ''}`;
  const res = await api.get<GetReviewsResponse>(url);
  return res.data;
};

export const getCompanyReviewsApi = async (
  params?: GetCompanyReviewsParams
): Promise<GetCompanyReviewsResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.productId) query.append('productId', params.productId);
  if (params?.rating) query.append('rating', String(params.rating));
  if (params?.replyStatus && params.replyStatus !== 'all') {
    query.append('replyStatus', params.replyStatus);
  }

  const queryString = query.toString();
  const url = `/reviews/company/mine${queryString ? `?${queryString}` : ''}`;
  const res = await api.get<GetCompanyReviewsResponse>(url);
  return res.data;
};

export const getMyProductReviewApi = async (
  productId: string
): Promise<{ success: boolean; review: Review | null }> => {
  const res = await api.get<{ success: boolean; review: Review | null }>(
    `/reviews/product/${productId}/my-review`
  );
  return res.data;
};

export const getMyReviewedProductIdsApi = async (): Promise<{
  success: boolean;
  productIds: string[];
  orderProductKeys: string[];
  reviews: Array<{ productId: string; orderId?: string; rating: number; createdAt: string }>;
}> => {
  const res = await api.get<{
    success: boolean;
    productIds: string[];
    orderProductKeys: string[];
    reviews: Array<{ productId: string; orderId?: string; rating: number; createdAt: string }>;
  }>('/reviews/my-reviews/product-ids');
  return res.data;
};

export const createReviewApi = async (
  productId: string,
  input: CreateReviewInput
): Promise<{ success: boolean; message: string; review: Review }> => {
  const res = await api.post<{ success: boolean; message: string; review: Review }>(
    `/reviews/product/${productId}`,
    input
  );
  return res.data;
};

export const updateReviewApi = async (
  reviewId: string,
  input: UpdateReviewInput
): Promise<{ success: boolean; message: string; review: Review }> => {
  const res = await api.put<{ success: boolean; message: string; review: Review }>(
    `/reviews/${reviewId}`,
    input
  );
  return res.data;
};

export const deleteReviewApi = async (
  reviewId: string
): Promise<{ success: boolean; message: string }> => {
  const res = await api.delete<{ success: boolean; message: string }>(
    `/reviews/${reviewId}`
  );
  return res.data;
};

export const voteHelpfulApi = async (
  reviewId: string
): Promise<{ success: boolean; helpfulVotes: number; isHelpfulByMe: boolean }> => {
  const res = await api.post<{
    success: boolean;
    helpfulVotes: number;
    isHelpfulByMe: boolean;
  }>(`/reviews/${reviewId}/helpful`);
  return res.data;
};

export const replyToReviewApi = async (
  reviewId: string,
  comment: string
): Promise<{
  success: boolean;
  message: string;
  merchantReply: ReviewMerchantReply;
}> => {
  const res = await api.post<{
    success: boolean;
    message: string;
    merchantReply: ReviewMerchantReply;
  }>(`/reviews/${reviewId}/reply`, { comment });
  return res.data;
};

export const deleteMerchantReplyApi = async (
  reviewId: string
): Promise<{ success: boolean; message: string }> => {
  const res = await api.delete<{ success: boolean; message: string }>(
    `/reviews/${reviewId}/reply`
  );
  return res.data;
};

export const uploadReviewPhotoApi = async (
  file: File
): Promise<{ success: boolean; url: string }> => {
  const formData = new FormData();
  formData.append('photo', file);

  const res = await api.post<{ success: boolean; url: string }>(
    '/reviews/upload-photo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
};
