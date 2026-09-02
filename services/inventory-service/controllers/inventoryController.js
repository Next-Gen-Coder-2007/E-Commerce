import mongoose from 'mongoose';
import crypto from 'crypto';
import InventoryItem from '../models/InventoryItem.js';
import StockMovement from '../models/StockMovement.js';
import redisClient, { isRedisReady } from '../config/redis.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';
import {
  publishInventoryReserved,
  publishInventoryReservationFailed,
  publishInventoryCommitted,
  publishInventoryReleased,
  publishInventoryRestocked,
} from '../events/inventoryProducer.js';

export const reserveStock = async (req, res, next) => {
  try {
    const { orderId, items = [], ttlSeconds = 900 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, {
        statusCode: 400,
        code: 'INVALID_INPUT',
        message: 'Items array is required for stock reservation',
      });
    }

    const reservationId = `RES_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const reservedItems = [];
    const rollbackList = [];

    for (const item of items) {
      const prodId = item.productId || item._id;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      if (!prodId || !mongoose.Types.ObjectId.isValid(prodId)) {
        continue;
      }

      // Atomic conditional update: increment reservedStock only if availableStock >= qty
      const updated = await InventoryItem.findOneAndUpdate(
        {
          productId: new mongoose.Types.ObjectId(prodId),
          $expr: {
            $gte: [{ $subtract: ['$totalStock', '$reservedStock'] }, qty],
          },
        },
        {
          $inc: { reservedStock: qty },
        },
        { new: true }
      );

      if (!updated) {
        // Rollback any items already reserved in this transaction
        for (const rb of rollbackList) {
          await InventoryItem.updateOne(
            { productId: rb.productId },
            { $inc: { reservedStock: -rb.qty } }
          );
        }

        publishInventoryReservationFailed(
          { orderId, failedProductId: prodId, requestedQuantity: qty },
          `Insufficient available stock for product ID: ${prodId}`,
          { correlationId: req.headers['x-correlation-id'], traceId: req.headers['x-trace-id'] }
        ).catch((err) => console.warn('[Inventory] Kafka publish error:', err.message));

        return sendError(res, {
          statusCode: 409,
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient available stock for product ID: ${prodId}`,
          details: { failedProductId: prodId, requestedQuantity: qty },
        });
      }

      rollbackList.push({ productId: updated.productId, qty });
      reservedItems.push({
        productId: updated.productId,
        quantity: qty,
        remainingAvailable: Math.max(0, updated.totalStock - updated.reservedStock),
      });

      // Log audit trail
      await StockMovement.create({
        productId: updated.productId,
        movementType: 'RESERVATION_HOLD',
        quantity: qty,
        previousAvailable: Math.max(0, updated.totalStock - (updated.reservedStock - qty)),
        newAvailable: Math.max(0, updated.totalStock - updated.reservedStock),
        orderId: orderId && mongoose.Types.ObjectId.isValid(orderId) ? orderId : undefined,
        reservationId,
        reason: `Checkout reservation for order ${orderId || 'PENDING'}`,
        performedBy: req.user?.userId || 'checkout-saga',
      });
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    if (isRedisReady()) {
      try {
        await redisClient.set(
          `inventory:reservation:${reservationId}`,
          JSON.stringify({ orderId, items: rollbackList, expiresAt }),
          'EX',
          ttlSeconds
        );
      } catch (err) {
        console.warn('[Inventory] Redis reservation cache warning:', err.message);
      }
    }

    publishInventoryReserved(
      { reservationId, orderId, reservedItems, expiresAt },
      { correlationId: req.headers['x-correlation-id'], traceId: req.headers['x-trace-id'] }
    ).catch((err) => console.warn('[Inventory] Kafka publish error:', err.message));

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Stock reserved successfully',
      data: {
        reservationId,
        orderId,
        reservedItems,
        expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const commitReservation = async (req, res, next) => {
  try {
    const { orderId, reservationId, items = [] } = req.body;

    let itemsToCommit = items;

    // Check Redis cache if items not provided
    if ((!itemsToCommit || itemsToCommit.length === 0) && reservationId && isRedisReady()) {
      try {
        const cached = await redisClient.get(`inventory:reservation:${reservationId}`);
        if (cached) {
          itemsToCommit = JSON.parse(cached).items || [];
        }
      } catch (e) {
        // Fallback
      }
    }

    for (const item of itemsToCommit) {
      const prodId = item.productId || item._id;
      const qty = Math.max(1, parseInt(item.quantity || item.qty, 10) || 1);

      if (!prodId || !mongoose.Types.ObjectId.isValid(prodId)) continue;

      const updated = await InventoryItem.findOneAndUpdate(
        { productId: new mongoose.Types.ObjectId(prodId) },
        {
          $inc: { totalStock: -qty, reservedStock: -qty },
        },
        { new: true }
      );

      if (updated) {
        await StockMovement.create({
          productId: updated.productId,
          movementType: 'PURCHASE_COMMIT',
          quantity: -qty,
          previousAvailable: Math.max(0, updated.totalStock + qty - updated.reservedStock),
          newAvailable: Math.max(0, updated.totalStock - updated.reservedStock),
          orderId: orderId && mongoose.Types.ObjectId.isValid(orderId) ? orderId : undefined,
          reservationId,
          reason: `Payment confirmed. Stock permanently committed for order ${orderId}`,
          performedBy: req.user?.userId || 'payment-commit',
        });
      }
    }

    if (reservationId && isRedisReady()) {
      try {
        await redisClient.del(`inventory:reservation:${reservationId}`);
      } catch (e) {
        // Silent
      }
    }

    publishInventoryCommitted(
      { orderId, reservationId, committedItems: itemsToCommit },
      { correlationId: req.headers['x-correlation-id'], traceId: req.headers['x-trace-id'] }
    ).catch((err) => console.warn('[Inventory] Kafka publish error:', err.message));

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Inventory reservation committed successfully',
      data: { orderId, reservationId, committed: true },
    });
  } catch (error) {
    next(error);
  }
};

export const releaseReservation = async (req, res, next) => {
  try {
    const { orderId, reservationId, items = [], reason = 'Checkout cancelled or expired' } = req.body;

    let itemsToRelease = items;

    if ((!itemsToRelease || itemsToRelease.length === 0) && reservationId && isRedisReady()) {
      try {
        const cached = await redisClient.get(`inventory:reservation:${reservationId}`);
        if (cached) {
          itemsToRelease = JSON.parse(cached).items || [];
        }
      } catch (e) {
        // Fallback
      }
    }

    for (const item of itemsToRelease) {
      const prodId = item.productId || item._id;
      const qty = Math.max(1, parseInt(item.quantity || item.qty, 10) || 1);

      if (!prodId || !mongoose.Types.ObjectId.isValid(prodId)) continue;

      const updated = await InventoryItem.findOneAndUpdate(
        { productId: new mongoose.Types.ObjectId(prodId) },
        {
          $inc: { reservedStock: -qty },
        },
        { new: true }
      );

      if (updated) {
        await StockMovement.create({
          productId: updated.productId,
          movementType: 'RESERVATION_RELEASE',
          quantity: qty,
          previousAvailable: Math.max(0, updated.totalStock - (updated.reservedStock + qty)),
          newAvailable: Math.max(0, updated.totalStock - updated.reservedStock),
          orderId: orderId && mongoose.Types.ObjectId.isValid(orderId) ? orderId : undefined,
          reservationId,
          reason,
          performedBy: req.user?.userId || 'release-handler',
        });
      }
    }

    if (reservationId && isRedisReady()) {
      try {
        await redisClient.del(`inventory:reservation:${reservationId}`);
      } catch (e) {
        // Silent
      }
    }

    publishInventoryReleased(
      { orderId, reservationId, releasedItems: itemsToRelease, reason },
      { correlationId: req.headers['x-correlation-id'], traceId: req.headers['x-trace-id'] }
    ).catch((err) => console.warn('[Inventory] Kafka publish error:', err.message));

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Inventory reservation released back to available pool',
      data: { orderId, reservationId, released: true },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductStock = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return sendError(res, {
        statusCode: 400,
        code: 'INVALID_ID',
        message: 'Valid Product ID is required',
      });
    }

    const item = await InventoryItem.findOne({
      productId: new mongoose.Types.ObjectId(productId),
    }).lean();

    if (!item) {
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Product inventory not yet initialized (defaults to in-stock)',
        data: {
          productId,
          totalStock: 0,
          reservedStock: 0,
          availableStock: 0,
          inStock: false,
        },
      });
    }

    const available = Math.max(0, item.totalStock - item.reservedStock);

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        productId: item.productId,
        sku: item.sku,
        totalStock: item.totalStock,
        reservedStock: item.reservedStock,
        availableStock: available,
        inStock: available > 0,
        lowStock: available <= (item.lowStockThreshold || 5),
        warehouseId: item.warehouseId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const restockItem = async (req, res, next) => {
  try {
    const {
      productId,
      quantity,
      sku,
      title,
      companyId: explicitCompanyId,
      companyName: explicitCompanyName,
      warehouseId = 'WH_EAST_01',
      reason = 'Merchant manual restock',
    } = req.body;

    const companyId = req.user?.userId || explicitCompanyId;
    const companyName = req.user?.companyName || explicitCompanyName || 'Direct Supplier';

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return sendError(res, {
        statusCode: 400,
        code: 'INVALID_ID',
        message: 'Valid Product ID is required for restock',
      });
    }

    const restockQty = parseInt(quantity, 10);
    if (isNaN(restockQty) || restockQty <= 0) {
      return sendError(res, {
        statusCode: 400,
        code: 'INVALID_QUANTITY',
        message: 'Restock quantity must be a positive integer',
      });
    }

    const item = await InventoryItem.findOneAndUpdate(
      { productId: new mongoose.Types.ObjectId(productId) },
      {
        $setOnInsert: {
          productId: new mongoose.Types.ObjectId(productId),
          sku: sku || `SKU-${productId.toString().slice(-6).toUpperCase()}`,
          title: title || 'Catalog Item',
          companyId: new mongoose.Types.ObjectId(companyId),
          companyName,
          warehouseId,
          reservedStock: 0,
        },
        $inc: { totalStock: restockQty },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const available = Math.max(0, item.totalStock - item.reservedStock);

    await StockMovement.create({
      productId: item.productId,
      movementType: 'INCOMING_RESTOCK',
      quantity: restockQty,
      previousAvailable: Math.max(0, available - restockQty),
      newAvailable: available,
      reason,
      performedBy: req.user?.name || companyName || 'merchant',
    });

    publishInventoryRestocked(
      {
        productId: item.productId,
        sku: item.sku,
        addedStock: restockQty,
        newTotalStock: item.totalStock,
        newAvailableStock: available,
      },
      { correlationId: req.headers['x-correlation-id'], traceId: req.headers['x-trace-id'] }
    ).catch((err) => console.warn('[Inventory] Kafka publish error:', err.message));

    return sendSuccess(res, {
      statusCode: 200,
      message: `Successfully restocked ${restockQty} units`,
      data: {
        item,
        availableStock: available,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMerchantInventory = async (req, res, next) => {
  try {
    const companyId = req.user?.userId;

    if (!companyId) {
      return sendError(res, {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Merchant authentication required',
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = { companyId: new mongoose.Types.ObjectId(companyId) };

    const [items, total, movements] = await Promise.all([
      InventoryItem.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      InventoryItem.countDocuments(query),
      StockMovement.find().sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    const enrichedItems = items.map((i) => ({
      ...i,
      availableStock: Math.max(0, i.totalStock - i.reservedStock),
      lowStock: Math.max(0, i.totalStock - i.reservedStock) <= (i.lowStockThreshold || 5),
    }));

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        items: enrichedItems,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        recentMovements: movements,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  reserveStock,
  commitReservation,
  releaseReservation,
  getProductStock,
  restockItem,
  getMerchantInventory,
};
