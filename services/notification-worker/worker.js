import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createConsumer, TOPICS, EVENT_TYPES } from '../shared/kafka/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('====================================================');
console.log('       NOTIFICATION EVENT CONSUMER WORKER           ');
console.log('====================================================');

const notificationConsumer = createConsumer('notification-worker', 'notification-workers-group', [
  TOPICS.ORDER_EVENTS,
  TOPICS.PAYMENT_EVENTS,
  TOPICS.WISHLIST_EVENTS,
  TOPICS.NOTIFICATION_EVENTS,
]);

// 1. Order Confirmed -> Customer Email
notificationConsumer.on(
  TOPICS.ORDER_EVENTS,
  EVENT_TYPES.ORDER_CONFIRMED,
  async (envelope, context) => {
    const { orderId, orderNumber, userId, totalAmount } = envelope.data || {};
    console.log(
      `📧 [Notification Worker] [EMAIL DISPATCHED] Order Confirmation: Order #${orderNumber || orderId} ($${totalAmount}) confirmed for User: ${userId}. Trace: ${envelope.traceId}`
    );
  }
);

// 2. Payment Succeeded -> Payment Receipt Email
notificationConsumer.on(
  TOPICS.PAYMENT_EVENTS,
  EVENT_TYPES.PAYMENT_COMPLETED,
  async (envelope) => {
    const { transactionId, orderId, amount, currency, paymentMethod } = envelope.data || {};
    console.log(
      `🧾 [Notification Worker] [RECEIPT DISPATCHED] Payment Receipt: Transaction ${transactionId} ($${amount} ${currency}) received via ${paymentMethod} for Order ${orderId}.`
    );
  }
);

// 3. Wishlist Price Drop -> Price Alert Push Notification / Email
notificationConsumer.on(
  TOPICS.WISHLIST_EVENTS,
  EVENT_TYPES.WISHLIST_PRICE_DROPPED,
  async (envelope) => {
    const { userId, title, previousPrice, newPrice, discountPct } = envelope.data || {};
    console.log(
      `🔔 [Notification Worker] [PRICE DROP ALERT] "${title}" dropped from $${previousPrice} to $${newPrice} (-${discountPct}%)! Dispatched alert to User: ${userId}.`
    );
  }
);

// 4. Custom Notification Dispatch Request
notificationConsumer.on(
  TOPICS.NOTIFICATION_EVENTS,
  EVENT_TYPES.NOTIFICATION_DISPATCH_REQUESTED,
  async (envelope) => {
    const { recipient, subject, channel, body } = envelope.data || {};
    console.log(
      `📨 [Notification Worker] [${(channel || 'EMAIL').toUpperCase()}] To: ${recipient} | Subject: "${subject}" | Body: ${body}`
    );
  }
);

notificationConsumer.start().then(() => {
  console.log('[Notification Worker] Actively listening for Kafka event streams...');
});

const shutdown = async () => {
  console.log('[Notification Worker] Shutting down gracefully...');
  await notificationConsumer.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default notificationConsumer;
