import express from 'express';
import {
  chargePayment,
  refundPayment,
  getPaymentByOrder,
  handleWebhook,
} from '../controllers/paymentController.js';
import { attachUser, requireAuth } from '../middleware/authCheck.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = express.Router();

// Payment Transactions with Idempotency Key check
router.post('/charge', attachUser, idempotencyMiddleware, chargePayment);
router.post('/refund', attachUser, refundPayment);
router.get('/order/:orderId', attachUser, getPaymentByOrder);

// Webhook endpoint
router.post('/webhook', handleWebhook);

export default router;
