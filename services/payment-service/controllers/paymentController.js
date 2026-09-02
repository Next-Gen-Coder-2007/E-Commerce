import mongoose from 'mongoose';
import crypto from 'crypto';
import PaymentTransaction from '../models/PaymentTransaction.js';
import { cacheIdempotentResult } from '../middleware/idempotency.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';
import {
  publishPaymentCompleted,
  publishPaymentFailed,
  publishPaymentRefunded,
} from '../events/paymentProducer.js';

export const chargePayment = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.body.userId;
    const {
      orderId,
      amount,
      currency = 'USD',
      paymentMethod = 'mock_instant',
      paymentDetails = {},
    } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return sendError(res, {
        statusCode: 400,
        code: 'INVALID_ORDER_ID',
        message: 'Valid orderId is required for payment processing',
      });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return sendError(res, {
        statusCode: 400,
        code: 'INVALID_AMOUNT',
        message: 'Payment amount must be greater than zero',
      });
    }

    const idempotencyKey = req.idempotencyKey || `auto_${Date.now()}`;
    const transactionId = `TXN_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Test card simulation: card ending with '0000' triggers simulated decline
    const isDeclineCard = paymentDetails.cardNumber?.endsWith('0000');
    const isSuccess = !isDeclineCard;

    const status = isSuccess ? 'succeeded' : 'failed';
    const failureReason = isSuccess ? '' : 'Card declined by issuing bank (Simulated)';

    const transaction = await PaymentTransaction.create({
      transactionId,
      orderId: new mongoose.Types.ObjectId(orderId),
      userId: userId && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : new mongoose.Types.ObjectId(),
      amount: Number(numAmount.toFixed(2)),
      currency: currency.toUpperCase(),
      paymentMethod,
      status,
      idempotencyKey,
      gatewayProvider: 'Stripe_Mock',
      gatewayTxnId: `ch_${crypto.randomBytes(8).toString('hex')}`,
      failureReason,
      paidAt: isSuccess ? new Date() : undefined,
    });

    const responseData = {
      transactionId: transaction.transactionId,
      orderId: transaction.orderId,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      paidAt: transaction.paidAt,
      idempotencyKey: transaction.idempotencyKey,
      failureReason: transaction.failureReason,
    };

    const statusCode = isSuccess ? 201 : 402;
    const responsePayload = {
      statusCode,
      message: isSuccess ? 'Payment processed successfully' : 'Payment charge failed',
      data: responseData,
    };

    // Cache idempotency result for 24h
    if (idempotencyKey) {
      await cacheIdempotentResult(idempotencyKey, statusCode, responsePayload);
    }

    if (!isSuccess) {
      publishPaymentFailed(transaction, failureReason, {
        correlationId: req.headers['x-correlation-id'],
        traceId: req.headers['x-trace-id'],
      }).catch((err) => console.warn('[Payment] Kafka publish error:', err.message));

      return sendError(res, {
        statusCode: 402,
        code: 'PAYMENT_DECLINED',
        message: failureReason,
        data: responseData,
      });
    }

    publishPaymentCompleted(transaction, {
      correlationId: req.headers['x-correlation-id'],
      traceId: req.headers['x-trace-id'],
    }).catch((err) => console.warn('[Payment] Kafka publish error:', err.message));

    return sendSuccess(res, responsePayload);
  } catch (error) {
    next(error);
  }
};

export const refundPayment = async (req, res, next) => {
  try {
    const { orderId, transactionId, amount, reason = 'Customer refund requested' } = req.body;

    const query = {};
    if (transactionId) {
      query.transactionId = transactionId;
    } else if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      query.orderId = new mongoose.Types.ObjectId(orderId);
      query.status = 'succeeded';
    } else {
      return sendError(res, {
        statusCode: 400,
        code: 'INVALID_INPUT',
        message: 'Order ID or Transaction ID is required to process refund',
      });
    }

    const transaction = await PaymentTransaction.findOne(query);
    if (!transaction) {
      return sendError(res, {
        statusCode: 404,
        code: 'TRANSACTION_NOT_FOUND',
        message: 'No completed payment transaction found for this order',
      });
    }

    if (transaction.status === 'refunded') {
      return sendError(res, {
        statusCode: 400,
        code: 'ALREADY_REFUNDED',
        message: 'Payment has already been refunded',
        data: transaction,
      });
    }

    const refundAmount = amount ? Number(amount) : transaction.amount;
    const refundTxnId = `REF_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    transaction.status = 'refunded';
    transaction.refundDetails = {
      isRefunded: true,
      amount: Number(refundAmount.toFixed(2)),
      refundedAt: new Date(),
      reason,
      refundTxnId,
    };

    await transaction.save();

    publishPaymentRefunded(
      {
        refundId: refundTxnId,
        transactionId: transaction.transactionId,
        orderId: transaction.orderId,
        amount: refundAmount,
        reason,
      },
      {
        correlationId: req.headers['x-correlation-id'],
        traceId: req.headers['x-trace-id'],
      }
    ).catch((err) => console.warn('[Payment] Kafka publish error:', err.message));

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Payment refunded successfully',
      data: {
        transactionId: transaction.transactionId,
        orderId: transaction.orderId,
        refundTxnId,
        refundAmount,
        refundedAt: transaction.refundDetails.refundedAt,
        status: 'refunded',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentByOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return sendError(res, {
        statusCode: 400,
        code: 'INVALID_ORDER_ID',
        message: 'Valid orderId is required',
      });
    }

    const transaction = await PaymentTransaction.findOne({
      orderId: new mongoose.Types.ObjectId(orderId),
    }).sort({ createdAt: -1 }).lean();

    if (!transaction) {
      return sendError(res, {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: `No payment transaction found for order #${orderId}`,
      });
    }

    return sendSuccess(res, {
      statusCode: 200,
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const event = req.body;
    const eventType = event.type || 'payment.event';

    console.log(`[Payment Webhook] Ingested webhook event '${eventType}':`, event.id || 'no-id');

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Webhook received and acknowledged',
      data: { received: true, eventType },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  chargePayment,
  refundPayment,
  getPaymentByOrder,
  handleWebhook,
};
