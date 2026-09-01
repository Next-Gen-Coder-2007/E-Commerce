import express from 'express';
import {
  createCoupon,
  getMyCompanyCoupons,
  getAvailableCoupons,
  validateCoupon,
  redeemCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
} from '../controllers/couponController.js';
import { attachUser, requireAuth, requireCompany } from '../middleware/authCheck.js';

const router = express.Router();

// Public / Shopper routes
router.get('/available', attachUser, getAvailableCoupons);
router.post('/validate', attachUser, validateCoupon);

// Internal Order-Service redemption hook
router.post('/redeem', redeemCoupon);

// Merchant Storefront routes
router.get('/company/mine', requireCompany, getMyCompanyCoupons);
router.post('/', requireCompany, createCoupon);
router.put('/:id', requireCompany, updateCoupon);
router.patch('/:id/toggle', requireCompany, toggleCouponStatus);
router.delete('/:id', requireCompany, deleteCoupon);

export default router;
