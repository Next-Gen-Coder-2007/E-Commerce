import api from './api';
import type {
  Coupon,
  GetCompanyCouponsResponse,
  GetAvailableCouponsResponse,
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponInput,
  ValidateCouponResponse,
} from '../types/coupon';

export interface GetAvailableCouponsParams {
  companyId?: string;
  productId?: string;
}

export const getMyCompanyCouponsApi = async (): Promise<GetCompanyCouponsResponse> => {
  const res = await api.get<GetCompanyCouponsResponse>('/coupons/company/mine');
  return res.data;
};

export const getAvailableCouponsApi = async (
  params?: GetAvailableCouponsParams
): Promise<GetAvailableCouponsResponse> => {
  const query = new URLSearchParams();
  if (params?.companyId) query.append('companyId', params.companyId);
  if (params?.productId) query.append('productId', params.productId);

  const queryString = query.toString();
  const url = `/coupons/available${queryString ? `?${queryString}` : ''}`;
  const res = await api.get<GetAvailableCouponsResponse>(url);
  return res.data;
};

export const validateCouponApi = async (
  input: ValidateCouponInput
): Promise<ValidateCouponResponse> => {
  const res = await api.post<ValidateCouponResponse>('/coupons/validate', input);
  return res.data;
};

export const createCouponApi = async (
  input: CreateCouponInput
): Promise<{ success: boolean; message: string; coupon: Coupon }> => {
  const res = await api.post<{ success: boolean; message: string; coupon: Coupon }>(
    '/coupons',
    input
  );
  return res.data;
};

export const updateCouponApi = async (
  couponId: string,
  input: UpdateCouponInput
): Promise<{ success: boolean; message: string; coupon: Coupon }> => {
  const res = await api.put<{ success: boolean; message: string; coupon: Coupon }>(
    `/coupons/${couponId}`,
    input
  );
  return res.data;
};

export const toggleCouponApi = async (
  couponId: string
): Promise<{ success: boolean; message: string; isActive: boolean }> => {
  const res = await api.patch<{ success: boolean; message: string; isActive: boolean }>(
    `/coupons/${couponId}/toggle`
  );
  return res.data;
};

export const deleteCouponApi = async (
  couponId: string
): Promise<{ success: boolean; message: string }> => {
  const res = await api.delete<{ success: boolean; message: string }>(
    `/coupons/${couponId}`
  );
  return res.data;
};
