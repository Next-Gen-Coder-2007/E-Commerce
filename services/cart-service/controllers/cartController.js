import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import redisClient, { isRedisReady } from '../config/redis.js';

const getCartCacheKey = (userId, guestId) => {
  if (userId) return `cart:user:${userId}`;
  if (guestId) return `cart:guest:${guestId}`;
  return null;
};

const invalidateCartCache = async (userId, guestId) => {
  if (!isRedisReady()) return;
  const key = getCartCacheKey(userId, guestId);
  if (key) {
    try {
      await redisClient.del(key);
    } catch (e) {
      console.warn(`[Cart Cache] Error deleting key ${key}:`, e.message);
    }
  }
};

const getOrCreateCart = async (userId, guestId) => {
  let cart = null;

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }
    return cart;
  }

  if (guestId) {
    cart = await Cart.findOne({ guestId });
    if (!cart) {
      cart = await Cart.create({ guestId, items: [] });
    }
    return cart;
  }

  const generatedGuestId = `guest_${new mongoose.Types.ObjectId().toString()}`;
  cart = await Cart.create({ guestId: generatedGuestId, items: [] });
  return cart;
};

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const guestId = req.guestId;

    const cacheKey = getCartCacheKey(userId, guestId);
    if (isRedisReady() && cacheKey) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          return res.status(200).json({
            success: true,
            cart: parsed,
            guestId: !userId ? guestId : undefined,
            fromCache: true,
          });
        }
      } catch (e) {
        // Continue to DB on cache read error
      }
    }

    const cart = await getOrCreateCart(userId, guestId);

    if (isRedisReady() && cacheKey) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(cart), 'EX', 3600);
      } catch (e) {
        // Silent catch for Redis write
      }
    }

    return res.status(200).json({
      success: true,
      cart,
      guestId: !userId ? cart.guestId || guestId : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const guestId = req.guestId;
    const {
      productId,
      title,
      price,
      image,
      category,
      companyName,
      quantity = 1,
      stock,
    } = req.body;

    if (!productId || !title || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, title, and price are required to add to cart',
      });
    }

    const addQty = Math.max(1, parseInt(quantity, 10) || 1);
    const cart = await getOrCreateCart(userId, guestId);

    const existingIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (existingIndex > -1) {
      const currentItem = cart.items[existingIndex];
      const newQuantity = currentItem.quantity + addQty;
      const maxStock = stock !== undefined ? Number(stock) : currentItem.stock;

      if (maxStock && newQuantity > maxStock) {
        cart.items[existingIndex].quantity = maxStock;
      } else {
        cart.items[existingIndex].quantity = newQuantity;
      }

      if (price !== undefined) cart.items[existingIndex].price = Number(price);
      if (image) cart.items[existingIndex].image = image;
      if (title) cart.items[existingIndex].title = title;
      if (stock !== undefined) cart.items[existingIndex].stock = Number(stock);
    } else {
      cart.items.push({
        productId,
        title,
        price: Number(price),
        image: image || undefined,
        category: category || 'general',
        companyName: companyName || '',
        quantity: stock ? Math.min(addQty, Number(stock)) : addQty,
        stock: stock !== undefined ? Number(stock) : 999,
      });
    }

    await cart.save();
    await invalidateCartCache(userId, cart.guestId || guestId);

    return res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      cart,
      guestId: !userId ? cart.guestId || guestId : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const guestId = req.guestId;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID parameter is required',
      });
    }

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Quantity value is required',
      });
    }

    const newQuantity = parseInt(quantity, 10);
    const cart = await getOrCreateCart(userId, guestId);

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in current cart',
      });
    }

    if (newQuantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const item = cart.items[itemIndex];
      if (item.stock && newQuantity > item.stock) {
        item.quantity = item.stock;
      } else {
        item.quantity = newQuantity;
      }
    }

    await cart.save();
    await invalidateCartCache(userId, cart.guestId || guestId);

    return res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      cart,
      guestId: !userId ? cart.guestId || guestId : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const guestId = req.guestId;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID parameter is required',
      });
    }

    const cart = await getOrCreateCart(userId, guestId);

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    );

    await cart.save();
    await invalidateCartCache(userId, cart.guestId || guestId);

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart,
      guestId: !userId ? cart.guestId || guestId : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const guestId = req.guestId;

    const cart = await getOrCreateCart(userId, guestId);
    cart.items = [];

    await cart.save();
    await invalidateCartCache(userId, cart.guestId || guestId);

    return res.status(200).json({
      success: true,
      message: 'Shopping cart cleared successfully',
      cart,
      guestId: !userId ? cart.guestId || guestId : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const mergeCart = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const guestId = req.body.guestId || req.guestId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Authenticated user required to merge carts',
      });
    }

    if (!guestId) {
      const userCart = await getOrCreateCart(userId, null);
      return res.status(200).json({
        success: true,
        message: 'No guest cart provided to merge',
        cart: userCart,
      });
    }

    const guestCart = await Cart.findOne({ guestId });
    const userCart = await getOrCreateCart(userId, null);

    if (guestCart && guestCart.items.length > 0) {
      for (const guestItem of guestCart.items) {
        const existingIdx = userCart.items.findIndex(
          (item) => item.productId.toString() === guestItem.productId.toString()
        );

        if (existingIdx > -1) {
          const combinedQty = userCart.items[existingIdx].quantity + guestItem.quantity;
          const maxStock = guestItem.stock || userCart.items[existingIdx].stock;
          userCart.items[existingIdx].quantity = maxStock ? Math.min(combinedQty, maxStock) : combinedQty;
        } else {
          userCart.items.push({
            productId: guestItem.productId,
            title: guestItem.title,
            price: guestItem.price,
            image: guestItem.image,
            category: guestItem.category,
            companyName: guestItem.companyName,
            quantity: guestItem.quantity,
            stock: guestItem.stock,
          });
        }
      }

      await userCart.save();
      await Cart.deleteOne({ _id: guestCart._id });
      await invalidateCartCache(null, guestId);
    }

    await invalidateCartCache(userId, null);

    return res.status(200).json({
      success: true,
      message: 'Guest cart merged successfully into user account',
      cart: userCart,
    });
  } catch (error) {
    next(error);
  }
};
