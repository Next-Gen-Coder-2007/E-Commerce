export type DiscountType = 'percentage' | 'fixed';

export interface CouponUsage {
  userId: string;
  orderId?: string;
  discountAmount: number;
  usedAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number | null;
  companyId?: string | null;
  companyName?: string;
  applicableProducts?: string[];
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  userUsageLimit: number;
  usageCount: number;
  totalDiscountGiven: number;
  usedBy?: CouponUsage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCouponMetrics {
  totalCoupons: number;
  activeCoupons: number;
  totalRedemptions: number;
  totalSavingsGranted: number;
}

export interface GetCompanyCouponsResponse {
  success: boolean;
  summary: CompanyCouponMetrics;
  coupons: Coupon[];
}

export interface GetAvailableCouponsResponse {
  success: boolean;
  count: number;
  coupons: Coupon[];
}

export interface CreateCouponInput {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number | null;
  applicableProducts?: string[];
  startDate?: string;
  endDate: string;
  usageLimit?: number | null;
  userUsageLimit?: number;
}

export interface UpdateCouponInput {
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number | null;
  endDate?: string;
  usageLimit?: number | null;
  userUsageLimit?: number;
  isActive?: boolean;
}

export interface ValidateCouponInput {
  code: string;
  cartItems?: Array<{
    productId?: string;
    companyId?: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  userId?: string;
}

export interface ValidateCouponResponse {
  isValid: boolean;
  code?: string;
  couponId?: string;
  discountType?: DiscountType;
  discountValue?: number;
  discountAmount: number;
  finalTotal: number;
  companyName?: string;
  message: string;
}
