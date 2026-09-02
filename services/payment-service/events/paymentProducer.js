import { createProducer, TOPICS, EVENT_TYPES } from '../../shared/kafka/index.js';

const paymentProducer = createProducer('payment-service');

export const publishPaymentInitiated = async (paymentData, options = {}) => {
  return paymentProducer.publishEvent(
    TOPICS.PAYMENT_EVENTS,
    EVENT_TYPES.PAYMENT_INITIATED,
    {
      orderId: paymentData.orderId?.toString(),
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      paymentMethod: paymentData.paymentMethod,
      userId: paymentData.userId?.toString(),
    },
    {
      key: paymentData.orderId?.toString(),
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishPaymentCompleted = async (transaction, options = {}) => {
  return paymentProducer.publishEvent(
    TOPICS.PAYMENT_EVENTS,
    EVENT_TYPES.PAYMENT_COMPLETED,
    {
      transactionId: transaction.transactionId,
      orderId: transaction.orderId?.toString(),
      userId: transaction.userId?.toString(),
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      gatewayProvider: transaction.gatewayProvider,
      paidAt: transaction.paidAt || new Date().toISOString(),
    },
    {
      key: transaction.orderId?.toString(),
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishPaymentFailed = async (transaction, reason = '', options = {}) => {
  return paymentProducer.publishEvent(
    TOPICS.PAYMENT_EVENTS,
    EVENT_TYPES.PAYMENT_FAILED,
    {
      transactionId: transaction.transactionId,
      orderId: transaction.orderId?.toString(),
      userId: transaction.userId?.toString(),
      amount: transaction.amount,
      currency: transaction.currency,
      reason: reason || transaction.failureReason || 'Payment declined',
      failedAt: new Date().toISOString(),
    },
    {
      key: transaction.orderId?.toString(),
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishPaymentRefunded = async (refundData, options = {}) => {
  return paymentProducer.publishEvent(
    TOPICS.PAYMENT_EVENTS,
    EVENT_TYPES.PAYMENT_REFUNDED,
    {
      refundId: refundData.refundId,
      transactionId: refundData.transactionId,
      orderId: refundData.orderId?.toString(),
      amount: refundData.amount,
      reason: refundData.reason,
      refundedAt: new Date().toISOString(),
    },
    {
      key: refundData.orderId?.toString(),
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export default paymentProducer;
