import { createProducer, TOPICS, EVENT_TYPES } from '../../shared/kafka/index.js';

const wishlistProducer = createProducer('wishlist-service');

export const publishWishlistItemAdded = async (data, options = {}) => {
  return wishlistProducer.publishEvent(
    TOPICS.WISHLIST_EVENTS,
    EVENT_TYPES.WISHLIST_ITEM_ADDED,
    {
      userId: data.userId?.toString(),
      productId: data.productId?.toString(),
      title: data.title,
      price: data.price,
      addedAt: new Date().toISOString(),
    },
    {
      key: data.userId?.toString() || data.productId?.toString(),
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishWishlistItemRemoved = async (data, options = {}) => {
  return wishlistProducer.publishEvent(
    TOPICS.WISHLIST_EVENTS,
    EVENT_TYPES.WISHLIST_ITEM_REMOVED,
    {
      userId: data.userId?.toString(),
      productId: data.productId?.toString(),
      removedAt: new Date().toISOString(),
    },
    {
      key: data.userId?.toString(),
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishWishlistPriceDropped = async (data, options = {}) => {
  return wishlistProducer.publishEvent(
    TOPICS.WISHLIST_EVENTS,
    EVENT_TYPES.WISHLIST_PRICE_DROPPED,
    {
      userId: data.userId?.toString(),
      productId: data.productId?.toString(),
      title: data.title,
      previousPrice: data.previousPrice,
      newPrice: data.newPrice,
      discountPct: data.discountPct,
      notifiedAt: new Date().toISOString(),
    },
    {
      key: data.userId?.toString() || data.productId?.toString(),
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishWishlistMovedToCart = async (data, options = {}) => {
  return wishlistProducer.publishEvent(
    TOPICS.WISHLIST_EVENTS,
    EVENT_TYPES.WISHLIST_MOVED_TO_CART,
    {
      userId: data.userId?.toString(),
      productId: data.productId?.toString(),
      quantity: data.quantity || 1,
      movedAt: new Date().toISOString(),
    },
    {
      key: data.userId?.toString(),
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export default wishlistProducer;
