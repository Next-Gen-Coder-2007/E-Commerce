import mongoose from 'mongoose';
import { createConsumer, TOPICS, EVENT_TYPES } from '../../shared/kafka/index.js';
import InventoryItem from '../models/InventoryItem.js';
import StockMovement from '../models/StockMovement.js';
import redisClient, { isRedisReady } from '../config/redis.js';
import { publishInventoryCommitted, publishInventoryReleased } from './inventoryProducer.js';

const inventoryConsumer = createConsumer('inventory-service', 'inventory-service-group', [
  TOPICS.ORDER_EVENTS,
  TOPICS.PAYMENT_EVENTS,
]);

// On PAYMENT_COMPLETED -> Commit Stock
inventoryConsumer.on(
  TOPICS.PAYMENT_EVENTS,
  EVENT_TYPES.PAYMENT_COMPLETED,
  async (envelope) => {
    const { orderId } = envelope.data || {};
    if (!orderId) return;

    try {
      // Find active holds/movements for this order that have not been committed
      const movements = await StockMovement.find({
        orderId: mongoose.Types.ObjectId.isValid(orderId) ? new mongoose.Types.ObjectId(orderId) : undefined,
        movementType: 'RESERVATION_HOLD',
      });

      if (!movements || movements.length === 0) return;

      const committedItems = [];

      for (const mov of movements) {
        // Permanently decrement totalStock and reservedStock
        const item = await InventoryItem.findOneAndUpdate(
          { productId: mov.productId },
          {
            $inc: {
              totalStock: -mov.quantity,
              reservedStock: -mov.quantity,
            },
          },
          { new: true }
        );

        if (item) {
          committedItems.push({
            productId: item.productId,
            quantity: mov.quantity,
            newTotalStock: item.totalStock,
          });

          await StockMovement.create({
            productId: item.productId,
            movementType: 'PURCHASE_COMMIT',
            quantity: mov.quantity,
            previousAvailable: Math.max(0, item.totalStock + mov.quantity - (item.reservedStock + mov.quantity)),
            newAvailable: Math.max(0, item.totalStock - item.reservedStock),
            orderId: mov.orderId,
            reservationId: mov.reservationId,
            reason: `Kafka event: payment completed for order ${orderId}`,
            performedBy: 'kafka-consumer',
          });
        }
      }

      console.log(`[Inventory Consumer] Committed ${committedItems.length} item(s) for order ${orderId}`);

      await publishInventoryCommitted(
        {
          orderId,
          committedItems,
        },
        { correlationId: envelope.correlationId, traceId: envelope.traceId }
      );
    } catch (err) {
      console.error(`[Inventory Consumer] Error committing stock for order ${orderId}:`, err.message);
    }
  }
);

// On ORDER_CANCELLED or PAYMENT_FAILED -> Release Stock
const handleRelease = async (envelope, reasonLabel) => {
  const { orderId, reason } = envelope.data || {};
  if (!orderId) return;

  try {
    const movements = await StockMovement.find({
      orderId: mongoose.Types.ObjectId.isValid(orderId) ? new mongoose.Types.ObjectId(orderId) : undefined,
      movementType: 'RESERVATION_HOLD',
    });

    if (!movements || movements.length === 0) return;

    const releasedItems = [];

    for (const mov of movements) {
      const item = await InventoryItem.findOneAndUpdate(
        { productId: mov.productId },
        {
          $inc: { reservedStock: -mov.quantity },
        },
        { new: true }
      );

      if (item) {
        releasedItems.push({
          productId: item.productId,
          quantity: mov.quantity,
          availableStock: Math.max(0, item.totalStock - item.reservedStock),
        });

        await StockMovement.create({
          productId: item.productId,
          movementType: 'RESERVATION_RELEASE',
          quantity: mov.quantity,
          previousAvailable: Math.max(0, item.totalStock - (item.reservedStock + mov.quantity)),
          newAvailable: Math.max(0, item.totalStock - item.reservedStock),
          orderId: mov.orderId,
          reservationId: mov.reservationId,
          reason: `Kafka event: ${reasonLabel} (${reason || 'no details'})`,
          performedBy: 'kafka-consumer',
        });
      }
    }

    console.log(`[Inventory Consumer] Released stock for order ${orderId} (${reasonLabel})`);

    await publishInventoryReleased(
      {
        orderId,
        releasedItems,
        reason: `${reasonLabel}: ${reason || ''}`,
      },
      { correlationId: envelope.correlationId, traceId: envelope.traceId }
    );
  } catch (err) {
    console.error(`[Inventory Consumer] Error releasing stock for order ${orderId}:`, err.message);
  }
};

inventoryConsumer.on(TOPICS.ORDER_EVENTS, EVENT_TYPES.ORDER_CANCELLED, (env) =>
  handleRelease(env, 'ORDER_CANCELLED')
);
inventoryConsumer.on(TOPICS.PAYMENT_EVENTS, EVENT_TYPES.PAYMENT_FAILED, (env) =>
  handleRelease(env, 'PAYMENT_FAILED')
);

export default inventoryConsumer;
