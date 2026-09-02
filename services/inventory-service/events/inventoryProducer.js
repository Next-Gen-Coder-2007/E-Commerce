import { createProducer, TOPICS, EVENT_TYPES } from '../../shared/kafka/index.js';

const inventoryProducer = createProducer('inventory-service');

export const publishInventoryReserved = async (data, options = {}) => {
  return inventoryProducer.publishEvent(
    TOPICS.INVENTORY_EVENTS,
    EVENT_TYPES.INVENTORY_RESERVED,
    {
      reservationId: data.reservationId,
      orderId: data.orderId?.toString(),
      reservedItems: data.reservedItems,
      expiresAt: data.expiresAt,
    },
    {
      key: data.orderId?.toString() || data.reservationId,
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishInventoryReservationFailed = async (data, reason = '', options = {}) => {
  return inventoryProducer.publishEvent(
    TOPICS.INVENTORY_EVENTS,
    EVENT_TYPES.INVENTORY_RESERVED_FAILED || EVENT_TYPES.INVENTORY_RESERVATION_FAILED,
    {
      orderId: data.orderId?.toString(),
      failedProductId: data.failedProductId?.toString(),
      requestedQuantity: data.requestedQuantity,
      reason,
    },
    {
      key: data.orderId?.toString(),
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishInventoryCommitted = async (data, options = {}) => {
  return inventoryProducer.publishEvent(
    TOPICS.INVENTORY_EVENTS,
    EVENT_TYPES.INVENTORY_COMMITTED,
    {
      reservationId: data.reservationId,
      orderId: data.orderId?.toString(),
      committedItems: data.committedItems,
      committedAt: new Date().toISOString(),
    },
    {
      key: data.orderId?.toString() || data.reservationId,
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishInventoryReleased = async (data, options = {}) => {
  return inventoryProducer.publishEvent(
    TOPICS.INVENTORY_EVENTS,
    EVENT_TYPES.INVENTORY_RELEASED,
    {
      reservationId: data.reservationId,
      orderId: data.orderId?.toString(),
      releasedItems: data.releasedItems,
      reason: data.reason,
      releasedAt: new Date().toISOString(),
    },
    {
      key: data.orderId?.toString() || data.reservationId,
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishInventoryRestocked = async (data, options = {}) => {
  return inventoryProducer.publishEvent(
    TOPICS.INVENTORY_EVENTS,
    EVENT_TYPES.INVENTORY_RESTOCKED,
    {
      productId: data.productId?.toString(),
      sku: data.sku,
      addedStock: data.addedStock,
      newTotalStock: data.newTotalStock,
      newAvailableStock: data.newAvailableStock,
    },
    {
      key: data.productId?.toString(),
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export default inventoryProducer;
