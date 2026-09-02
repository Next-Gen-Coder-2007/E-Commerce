import mongoose from 'mongoose';
import crypto from 'crypto';
import Wishlist from '../models/Wishlist.js';
import redisClient, { isRedisReady } from '../config/redis.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';
import {
  publishWishlistItemAdded,
  publishWishlistItemRemoved,
  publishWishlistMovedToCart,
} from '../events/wishlistProducer.js';

const invalidateWishlistCache = async (userId) => {
  if (!userId || !isRedisReady()) return;
  try {
    await redisClient.del(`wishlist:user:${userId}`);
  } catch (e) {
    // Silent
  }
};

export const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required to view wishlist',
      });
    }

    const cacheKey = `wishlist:user:${userId}`;
    if (isRedisReady()) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return sendSuccess(res, {
            statusCode: 200,
            data: JSON.parse(cached),
          });
        }
      } catch (e) {
        // Fall through
      }
    }

    let wishlist = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId: new mongoose.Types.ObjectId(userId),
        items: [],
      });
      wishlist = wishlist.toObject();
    }

    // Enrich items with price drop flags
    const enrichedItems = (wishlist.items || []).map((item) => {
      const priceAtAdd = Number(item.priceAtAdd) || 0;
      const currentPrice = Number(item.currentPrice) || priceAtAdd;
      const isPriceDropped = currentPrice < priceAtAdd;
      const discountPct = isPriceDropped ? Math.round(((priceAtAdd - currentPrice) / priceAtAdd) * 100) : 0;

      return {
        ...item,
        isPriceDropped,
        priceDropAmount: isPriceDropped ? Number((priceAtAdd - currentPrice).toFixed(2)) : 0,
        discountPct,
      };
    });

    const responsePayload = {
      ...wishlist,
      items: enrichedItems,
      totalItems: enrichedItems.length,
    };

    if (isRedisReady()) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(responsePayload), 'EX', 300);
      } catch (e) {
        // Silent
      }
    }

    return sendSuccess(res, {
      statusCode: 200,
      data: responsePayload,
    });
  } catch (error) {
    next(error);
  }
};

export const addItemToWishlist = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const {
      productId,
      title,
      price,
      image = '',
      category = 'general',
      companyId,
      companyName = 'Direct Supplier',
    } = req.body;

    if (!userId) {
      return sendError(res, {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required to save items to wishlist',
      });
    }

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return sendError(res, {
        statusCode: 400,
        code: 'INVALID_ID',
        message: 'Valid Product ID is required',
      });
    }

    const numPrice = Number(price) || 0;

    let wishlist = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: new mongoose.Types.ObjectId(userId),
        items: [],
      });
    }

    const existingIndex = wishlist.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (existingIndex > -1) {
      // Update current price if changed
      wishlist.items[existingIndex].currentPrice = numPrice;
      wishlist.items[existingIndex].inStock = true;
    } else {
      wishlist.items.push({
        productId: new mongoose.Types.ObjectId(productId),
        title: title || 'Saved Product',
        priceAtAdd: numPrice,
        currentPrice: numPrice,
        image,
        category,
        companyId: companyId && mongoose.Types.ObjectId.isValid(companyId) ? new mongoose.Types.ObjectId(companyId) : undefined,
        companyName,
        inStock: true,
        addedAt: new Date(),
      });
    }

    wishlist.totalItems = wishlist.items.length;
    await wishlist.save();
    await invalidateWishlistCache(userId);

    publishWishlistItemAdded(
      { userId, productId, title, price: numPrice },
      { correlationId: req.headers['x-correlation-id'], traceId: req.headers['x-trace-id'] }
    ).catch((err) => console.warn('[Wishlist] Kafka publish error:', err.message));

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Product added to wishlist',
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const removeItemFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      return sendError(res, {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required to modify wishlist',
      });
    }

    const wishlist = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!wishlist) {
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Wishlist is empty',
        data: { items: [], totalItems: 0 },
      });
    }

    wishlist.items = wishlist.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    );
    wishlist.totalItems = wishlist.items.length;

    await wishlist.save();
    await invalidateWishlistCache(userId);

    publishWishlistItemRemoved(
      { userId, productId },
      { correlationId: req.headers['x-correlation-id'], traceId: req.headers['x-trace-id'] }
    ).catch((err) => console.warn('[Wishlist] Kafka publish error:', err.message));

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Product removed from wishlist',
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const moveToCart = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      return sendError(res, {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const wishlist = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!wishlist) {
      return sendError(res, {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Wishlist not found',
      });
    }

    const itemIndex = wishlist.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return sendError(res, {
        statusCode: 404,
        code: 'ITEM_NOT_IN_WISHLIST',
        message: 'Item was not found in your wishlist',
      });
    }

    const itemToMove = wishlist.items[itemIndex];

    // Remove from wishlist
    wishlist.items.splice(itemIndex, 1);
    wishlist.totalItems = wishlist.items.length;
    await wishlist.save();
    await invalidateWishlistCache(userId);

    publishWishlistMovedToCart(
      { userId, productId, quantity: 1 },
      { correlationId: req.headers['x-correlation-id'], traceId: req.headers['x-trace-id'] }
    ).catch((err) => console.warn('[Wishlist] Kafka publish error:', err.message));

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Item removed from wishlist and ready for cart addition',
      data: {
        item: itemToMove,
        remainingWishlist: wishlist,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedWishlist = async (req, res, next) => {
  try {
    const { shareToken } = req.params;

    if (!shareToken) {
      return sendError(res, {
        statusCode: 400,
        code: 'INVALID_TOKEN',
        message: 'Share token is required',
      });
    }

    const wishlist = await Wishlist.findOne({
      shareToken,
      isPublic: true,
    })
      .select('-userId')
      .lean();

    if (!wishlist) {
      return sendError(res, {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Shared wishlist not found or is set to private',
      });
    }

    return sendSuccess(res, {
      statusCode: 200,
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlistPrivacy = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { isPublic } = req.body;

    if (!userId) {
      return sendError(res, {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    let wishlist = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: new mongoose.Types.ObjectId(userId),
        items: [],
      });
    }

    wishlist.isPublic = Boolean(isPublic);

    if (wishlist.isPublic && !wishlist.shareToken) {
      wishlist.shareToken = `wsh_${crypto.randomBytes(8).toString('hex')}`;
    }

    await wishlist.save();
    await invalidateWishlistCache(userId);

    return sendSuccess(res, {
      statusCode: 200,
      message: `Wishlist is now ${wishlist.isPublic ? 'public (sharable)' : 'private'}`,
      data: {
        isPublic: wishlist.isPublic,
        shareToken: wishlist.shareToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const clearWishlist = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    await Wishlist.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: { items: [], totalItems: 0 } }
    );

    await invalidateWishlistCache(userId);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Wishlist cleared successfully',
      data: { items: [], totalItems: 0 },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getWishlist,
  addItemToWishlist,
  removeItemFromWishlist,
  moveToCart,
  getSharedWishlist,
  toggleWishlistPrivacy,
  clearWishlist,
};
