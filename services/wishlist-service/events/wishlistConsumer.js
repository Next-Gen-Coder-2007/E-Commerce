import mongoose from 'mongoose';
import { createConsumer, TOPICS, EVENT_TYPES } from '../../shared/kafka/index.js';
import Wishlist from '../models/Wishlist.js';
import { publishWishlistPriceDropped } from './wishlistProducer.js';
import redisClient, { isRedisReady } from '../config/redis.js';

const wishlistConsumer = createConsumer('wishlist-service', 'wishlist-service-group', [
  TOPICS.CATALOG_EVENTS,
]);

// Listen for catalog price changes -> update matching wishlist items and notify
wishlistConsumer.on(
  TOPICS.CATALOG_EVENTS,
  EVENT_TYPES.CATALOG_PRICE_CHANGED,
  async (envelope) => {
    const { productId, newPrice, previousPrice, title } = envelope.data || {};
    if (!productId || typeof newPrice !== 'number') return;

    try {
      // Find wishlists containing this product
      const wishlists = await Wishlist.find({
        'items.productId': new mongoose.Types.ObjectId(productId),
      });

      if (!wishlists || wishlists.length === 0) return;

      for (const wl of wishlists) {
        let updated = false;
        let droppedForUser = false;
        let priceAtAdd = 0;

        wl.items = wl.items.map((item) => {
          if (item.productId.toString() === productId.toString()) {
            priceAtAdd = item.priceAtAdd || item.price || newPrice;
            item.currentPrice = newPrice;
            updated = true;

            if (newPrice < priceAtAdd) {
              droppedForUser = true;
            }
          }
          return item;
        });

        if (updated) {
          await wl.save();

          if (isRedisReady()) {
            await redisClient.del(`wishlist:user:${wl.userId}`);
          }

          if (droppedForUser) {
            const discountPct = Math.round(((priceAtAdd - newPrice) / priceAtAdd) * 100);
            console.log(
              `[Wishlist Consumer] Price drop detected for user ${wl.userId} on product ${productId}: $${priceAtAdd} -> $${newPrice} (-${discountPct}%)`
            );

            await publishWishlistPriceDropped(
              {
                userId: wl.userId,
                productId,
                title: title || 'Wishlisted Item',
                previousPrice: priceAtAdd,
                newPrice,
                discountPct,
              },
              { correlationId: envelope.correlationId, traceId: envelope.traceId }
            );
          }
        }
      }
    } catch (err) {
      console.error(`[Wishlist Consumer] Error processing catalog price change for product ${productId}:`, err.message);
    }
  }
);

export default wishlistConsumer;
