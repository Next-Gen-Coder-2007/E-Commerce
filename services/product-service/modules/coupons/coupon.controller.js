import * as baseCouponController from '../../controllers/couponController.js';
import { sendSuccess, sendError } from '../../utils/responseEnvelope.js';

export const {
  createCoupon,
  getMyCompanyCoupons,
  getAvailableCoupons,
  validateCoupon,
  redeemCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
} = baseCouponController;

export default {
  ...baseCouponController,
  sendSuccess,
  sendError,
};
