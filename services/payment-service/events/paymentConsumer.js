import { createConsumer, TOPICS, EVENT_TYPES } from '../../shared/kafka/index.js';
import PaymentTransaction from '../models/PaymentTransaction.js';
import { publishPaymentRefunded } from './paymentProducer.js';

const paymentConsumer = createConsumer('payment-service', 'payment-service-group', [
  TOPICS.ORDER_EVENTS,
]);

// Listen for order cancellation -> execute refund if payment already succeeded
paymentConsumer.on(
  TOPICS.ORDER_EVENTS,
  EVENT_TYPES.ORDER_CANCELLED,
  async (envelope, context) => {
    const { orderId, reason } = envelope.data || {};
    if (!orderId) return;

    try {
      const transaction = await PaymentTransaction.findOne({
        orderId,
        status: 'succeeded',
      });

      if (transaction && !transaction.isRefunded) {
        transaction.status = 'refunded';
        transaction.isRefunded = true;
        transaction.refundReason = reason || 'Automatic refund on order cancellation';
        transaction.refundedAt = new Date();
        await transaction.save();

        console.log(`[Payment Consumer] Issued automatic refund for cancelled order ${orderId} (Txn: ${transaction.transactionId})`);

        await publishPaymentRefunded(
          {
            refundId: `REF_${transaction.transactionId}`,
            transactionId: transaction.transactionId,
            orderId,
            amount: transaction.amount,
            reason: transaction.refundReason,
          },
          { correlationId: envelope.correlationId, traceId: envelope.traceId }
        );
      }
    } catch (err) {
      console.error(`[Payment Consumer] Error handling cancellation refund for order ${orderId}:`, err.message);
    }
  }
);

export default paymentConsumer;
