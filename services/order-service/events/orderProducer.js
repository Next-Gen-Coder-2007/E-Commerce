import { createProducer, TOPICS, EVENT_TYPES } from '../../shared/kafka/index.js';

const orderProducer = createProducer('order-service');

export const publishOrderCreated = async (order, options = {}) => {
  return orderProducer.publishEvent(
    TOPICS.ORDER_EVENTS,
    EVENT_TYPES.ORDER_CREATED,
    {
      orderId: order._id?.toString() || order.id,
      orderNumber: order.orderNumber,
      userId: order.userId?.toString(),
      customerEmail: order.customer?.email,
      customerName: order.customer?.name,
      totalAmount: order.totalAmount,
      currency: order.currency || 'USD',
      orderItems: order.orderItems,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      couponCode: order.couponCode,
      createdAt: order.createdAt || new Date().toISOString(),
    },
    {
      key: order._id?.toString() || order.id,
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishOrderConfirmed = async (order, options = {}) => {
  return orderProducer.publishEvent(
    TOPICS.ORDER_EVENTS,
    EVENT_TYPES.ORDER_CONFIRMED,
    {
      orderId: order._id?.toString() || order.id,
      orderNumber: order.orderNumber,
      userId: order.userId?.toString(),
      totalAmount: order.totalAmount,
      confirmedAt: new Date().toISOString(),
    },
    {
      key: order._id?.toString() || order.id,
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishOrderCancelled = async (order, reason = '', options = {}) => {
  return orderProducer.publishEvent(
    TOPICS.ORDER_EVENTS,
    EVENT_TYPES.ORDER_CANCELLED,
    {
      orderId: order._id?.toString() || order.id,
      orderNumber: order.orderNumber,
      userId: order.userId?.toString(),
      reason,
      cancelledAt: new Date().toISOString(),
    },
    {
      key: order._id?.toString() || order.id,
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export default orderProducer;
