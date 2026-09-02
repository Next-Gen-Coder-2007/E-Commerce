import { createConsumer, TOPICS, EVENT_TYPES } from '../../shared/kafka/index.js';
import Order from '../models/Order.js';

const orderConsumer = createConsumer('order-service', 'order-service-group', [
  TOPICS.PAYMENT_EVENTS,
  TOPICS.INVENTORY_EVENTS,
]);

// Handle payment completed -> Confirm order
orderConsumer.on(
  TOPICS.PAYMENT_EVENTS,
  EVENT_TYPES.PAYMENT_COMPLETED,
  async (envelope, context) => {
    const { orderId, transactionId, paymentMethod } = envelope.data || {};
    if (!orderId) return;

    try {
      const order = await Order.findById(orderId);
      if (!order) return;

      if (order.orderStatus === 'CREATED' || order.orderStatus === 'PENDING') {
        order.orderStatus = 'CONFIRMED';
        order.paymentStatus = 'PAID';
        order.paymentDetails = {
          ...order.paymentDetails,
          transactionId,
          paymentMethod,
          paidAt: new Date(),
        };
        order.timeline = order.timeline || [];
        order.timeline.push({
          status: 'CONFIRMED',
          title: 'Payment Captured & Order Confirmed',
          description: `Payment captured successfully via ${paymentMethod || 'gateway'} (Txn: ${transactionId}).`,
          timestamp: new Date(),
        });

        await order.save();
        console.log(`[Order Consumer] Order ${orderId} marked as CONFIRMED following payment completion`);
      }
    } catch (err) {
      console.error(`[Order Consumer] Error updating order ${orderId} on payment completion:`, err.message);
    }
  }
);

// Handle payment failed -> Cancel order
orderConsumer.on(
  TOPICS.PAYMENT_EVENTS,
  EVENT_TYPES.PAYMENT_FAILED,
  async (envelope) => {
    const { orderId, reason } = envelope.data || {};
    if (!orderId) return;

    try {
      const order = await Order.findById(orderId);
      if (!order) return;

      if (order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED') {
        order.orderStatus = 'CANCELLED';
        order.paymentStatus = 'FAILED';
        order.timeline = order.timeline || [];
        order.timeline.push({
          status: 'CANCELLED',
          title: 'Order Cancelled (Payment Failed)',
          description: reason || 'Payment authorization was declined or timed out.',
          timestamp: new Date(),
        });

        await order.save();
        console.log(`[Order Consumer] Order ${orderId} marked as CANCELLED following payment failure`);
      }
    } catch (err) {
      console.error(`[Order Consumer] Error cancelling order ${orderId} on payment failure:`, err.message);
    }
  }
);

// Handle inventory reservation failure -> Cancel order
orderConsumer.on(
  TOPICS.INVENTORY_EVENTS,
  EVENT_TYPES.INVENTORY_RESERVATION_FAILED,
  async (envelope) => {
    const { orderId, reason } = envelope.data || {};
    if (!orderId) return;

    try {
      const order = await Order.findById(orderId);
      if (!order) return;

      if (order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED') {
        order.orderStatus = 'CANCELLED';
        order.timeline = order.timeline || [];
        order.timeline.push({
          status: 'CANCELLED',
          title: 'Order Cancelled (Out of Stock)',
          description: reason || 'One or more items could not be reserved from warehouse inventory.',
          timestamp: new Date(),
        });

        await order.save();
        console.log(`[Order Consumer] Order ${orderId} marked as CANCELLED following stock reservation failure`);
      }
    } catch (err) {
      console.error(`[Order Consumer] Error handling inventory failure for order ${orderId}:`, err.message);
    }
  }
);

export default orderConsumer;
