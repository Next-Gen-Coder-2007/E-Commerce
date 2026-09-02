import express from 'express';
import {
  createOrder,
  checkoutWithSaga,
  getMyOrders,
  getOrderById,
  payOrder,
  cancelOrder,
  getCompanyOrders,
  updateOrderStatus,
  getOrderAnalytics,
  trackOrder,
  checkUserPurchasedProduct,
} from '../controllers/orderController.js';
import {
  attachOrderIdentity,
  requireAuth,
  requireMerchantOrAdmin,
  requireAdmin,
} from '../middleware/authCheck.js';
import {
  getAdminOrderMetrics,
  getAdminAllOrders,
  overrideOrderStatus,
} from '../controllers/adminOrderController.js';

const router = express.Router();

// Middleware to attach user identity across all routes
router.use(attachOrderIdentity);

// Admin Routes
router.get('/admin/metrics', requireAdmin, getAdminOrderMetrics);
router.get('/admin/all', requireAdmin, getAdminAllOrders);
router.patch('/admin/:id/override', requireAdmin, overrideOrderStatus);

// Public / Lookup Routes
router.get('/track/:orderNumber', trackOrder);
router.get('/check-purchase/:userId/:productId', checkUserPurchasedProduct);

// Customer Routes
router.post('/', requireAuth, createOrder);
router.post('/checkout-saga', requireAuth, checkoutWithSaga);
router.get('/my-orders', requireAuth, getMyOrders);
router.put('/:id/pay', requireAuth, payOrder);
router.put('/:id/cancel', requireAuth, cancelOrder);

// Merchant / Admin Routes
router.get('/company/orders', requireMerchantOrAdmin, getCompanyOrders);
router.get('/stats/summary', requireAuth, getOrderAnalytics);
router.put('/:id/status', requireMerchantOrAdmin, updateOrderStatus);

// Order Detail Lookup
router.get('/:id', getOrderById);

export default router;
