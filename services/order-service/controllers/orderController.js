import mongoose from 'mongoose';
import crypto from 'crypto';
import Order from '../models/Order.js';
import redisClient, { isRedisReady } from '../config/redis.js';

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${randomSuffix}`;
};

const invalidateOrderCaches = async (userId, orderId, companyId) => {
  if (!isRedisReady()) return;
  try {
    const keysToDelete = [];
    if (userId) {
      const userKeys = await redisClient.keys(`orders:user:${userId}:*`);
      keysToDelete.push(...userKeys);
      keysToDelete.push(`orders:user:${userId}`);
    }
    if (orderId) {
      keysToDelete.push(`order:id:${orderId}`);
    }
    if (companyId) {
      const companyKeys = await redisClient.keys(`orders:company:${companyId}:*`);
      keysToDelete.push(...companyKeys);
      keysToDelete.push(`orders:company:${companyId}:stats`);
    }

    if (keysToDelete.length > 0) {
      await redisClient.del(...keysToDelete);
    }
  } catch (err) {
    console.warn('[Order Cache] Invalidation error:', err.message);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const userEmail = req.user?.email || req.body.customer?.email;
    const userName = req.user?.name || req.body.customer?.name;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to create an order',
      });
    }

    if (userRole === 'company') {
      return res.status(403).json({
        success: false,
        message: 'Business accounts are not permitted to place customer orders. Please log out and sign in with a customer account to make purchases.',
      });
    }

    const {
      orderItems,
      shippingAddress,
      shippingMethod = 'standard',
      paymentMethod = 'mock_instant',
      couponCode = '',
      notes = '',
    } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete shipping address provided',
      });
    }

    const sanitizedItems = orderItems.map((item) => {
      const price = Number(item.price);
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      return {
        productId: item.productId || item._id,
        title: item.title,
        price,
        quantity,
        image: item.image || '',
        category: item.category || 'general',
        companyId: item.companyId || (item.company && item.company._id) || undefined,
        companyName: item.companyName || (item.company && item.company.name) || 'Direct Supplier',
      };
    });

    const itemsPrice = sanitizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let shippingPrice = 0;
    if (shippingMethod === 'express') {
      shippingPrice = 14.99;
    } else if (shippingMethod === 'priority') {
      shippingPrice = 24.99;
    } else if (shippingMethod === 'overnight') {
      shippingPrice = 34.99;
    } else {
      shippingPrice = itemsPrice >= 75 ? 0 : 7.99;
    }

    const taxPrice = Number((itemsPrice * 0.08).toFixed(2));

    let discountAmount = 0;
    const normalizedCoupon = (couponCode || '').trim().toUpperCase();
    if (normalizedCoupon === 'NOVA10' || normalizedCoupon === 'WELCOME10') {
      discountAmount = Number((itemsPrice * 0.10).toFixed(2));
    } else if (normalizedCoupon === 'NOVA20' || normalizedCoupon === 'SPRING20') {
      discountAmount = Number((itemsPrice * 0.20).toFixed(2));
    } else if (normalizedCoupon === 'FREESHIP') {
      discountAmount = shippingPrice;
      shippingPrice = 0;
    }

    const totalPrice = Number(
      Math.max(0, itemsPrice + shippingPrice + taxPrice - discountAmount).toFixed(2)
    );

    const isInstantPaid = paymentMethod === 'mock_instant' || paymentMethod === 'card';
    const initialStatus = isInstantPaid ? 'confirmed' : 'placed';
    const txnId = `TXN_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    const orderNumber = generateOrderNumber();

    const estimatedDays = shippingMethod === 'overnight' ? 1 : shippingMethod === 'express' ? 2 : 4;
    const estimatedDelivery = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);

    const initialHistory = [
      {
        status: 'placed',
        timestamp: new Date(),
        note: `Order ${orderNumber} placed successfully`,
        updatedBy: 'customer',
      },
    ];

    if (isInstantPaid) {
      initialHistory.push({
        status: 'confirmed',
        timestamp: new Date(),
        note: `Payment verified via ${paymentMethod.toUpperCase()} (${txnId})`,
        updatedBy: 'payment_gateway',
      });
    }

    const newOrder = new Order({
      orderNumber,
      userId,
      customer: {
        name: shippingAddress.fullName || userName || 'Customer',
        email: userEmail || 'customer@example.com',
        phone: shippingAddress.phone || '',
      },
      orderItems: sanitizedItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || 'United States',
        phone: shippingAddress.phone || '',
        deliveryNotes: shippingAddress.deliveryNotes || '',
      },
      shippingMethod,
      paymentInfo: {
        method: paymentMethod,
        status: isInstantPaid ? 'paid' : 'pending',
        transactionId: isInstantPaid ? txnId : '',
        paidAt: isInstantPaid ? new Date() : undefined,
      },
      pricing: {
        itemsPrice: Number(itemsPrice.toFixed(2)),
        shippingPrice: Number(shippingPrice.toFixed(2)),
        taxPrice: Number(taxPrice.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        couponCode: normalizedCoupon,
        totalPrice,
      },
      orderStatus: initialStatus,
      statusHistory: initialHistory,
      fulfillment: {
        carrier: 'NovaExpress',
        trackingNumber: `NVX-${Math.floor(10000000 + Math.random() * 90000000)}`,
        estimatedDelivery,
        shippingNotes: 'Package is being prepared for fulfillment',
      },
      notes: notes || '',
    });

    const savedOrder = await newOrder.save();

    const companyIds = [
      ...new Set(sanitizedItems.map((item) => item.companyId).filter(Boolean)),
    ];
    for (const compId of companyIds) {
      await invalidateOrderCaches(userId, savedOrder._id, compId);
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: savedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view orders',
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const cacheKey = `orders:user:${userId}:${page}:${limit}:${status || 'all'}`;
    if (isRedisReady()) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return res.status(200).json(JSON.parse(cached));
        }
      } catch (e) {
        // Continue to DB
      }
    }

    const query = { userId };
    if (status && status !== 'all') {
      if (status === 'active') {
        query.orderStatus = { $in: ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery'] };
      } else {
        query.orderStatus = status;
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    const responsePayload = {
      success: true,
      orders,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    };

    if (isRedisReady()) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(responsePayload), 'EX', 300);
      } catch (e) {
        // Silent
      }
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const userCompany = req.user?.companyName;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order identifier is required',
      });
    }

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).lean();
    } else {
      order = await Order.findOne({ orderNumber: id.toUpperCase() }).lean();
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order #${id} not found`,
      });
    }

    if (userId) {
      const isOwner = order.userId.toString() === userId.toString();
      const isAdmin = userRole === 'admin';
      const isMerchantOwner =
        userRole === 'company' &&
        order.orderItems.some(
          (item) =>
            (item.companyId && item.companyId.toString() === userId.toString()) ||
            (item.companyName && userCompany && item.companyName.toLowerCase() === userCompany.toLowerCase())
        );

      if (!isOwner && !isAdmin && !isMerchantOwner) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this order',
        });
      }
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const payOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { paymentMethod = 'mock_instant', transactionId } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.userId.toString() !== userId.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to modify payment for this order',
      });
    }

    if (order.paymentInfo.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already marked as paid',
        order,
      });
    }

    const txnId = transactionId || `TXN_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    order.paymentInfo.status = 'paid';
    order.paymentInfo.method = paymentMethod;
    order.paymentInfo.transactionId = txnId;
    order.paymentInfo.paidAt = new Date();

    if (order.orderStatus === 'placed') {
      order.orderStatus = 'confirmed';
    }

    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: `Payment completed via ${paymentMethod} (${txnId})`,
      updatedBy: req.user?.name || 'customer',
    });

    const updatedOrder = await order.save();

    await invalidateOrderCaches(order.userId, order._id);

    return res.status(200).json({
      success: true,
      message: 'Payment completed successfully',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { reason = 'Cancelled by user request' } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const isOwner = order.userId.toString() === userId.toString();
    const isAdmin = userRole === 'admin';
    const isMerchantOwner =
      userRole === 'company' &&
      order.orderItems.some(
        (item) => item.companyId && item.companyId.toString() === userId.toString()
      );

    if (!isOwner && !isAdmin && !isMerchantOwner) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this order',
      });
    }

    if (['shipped', 'out_for_delivery', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order in '${order.orderStatus}' status. Please initiate a return instead.`,
      });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
      });
    }

    order.orderStatus = 'cancelled';
    order.cancellation = {
      isCancelled: true,
      cancelledAt: new Date(),
      cancelReason: reason,
      cancelledBy: isOwner ? 'customer' : userRole || 'system',
    };

    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: `Order cancelled: ${reason}`,
      updatedBy: req.user?.name || 'user',
    });

    const updatedOrder = await order.save();

    await invalidateOrderCaches(order.userId, order._id);

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyOrders = async (req, res, next) => {
  try {
    const companyId = req.user?.userId;
    const companyName = req.user?.companyName;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Merchant authentication required',
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search?.trim();

    const merchantFilter = {
      $or: [
        { 'orderItems.companyId': new mongoose.Types.ObjectId(companyId) },
        ...(companyName ? [{ 'orderItems.companyName': companyName }] : []),
      ],
    };

    const query = { ...merchantFilter };

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    if (search) {
      query.$and = [
        merchantFilter,
        {
          $or: [
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'customer.name': { $regex: search, $options: 'i' } },
            { 'customer.email': { $regex: search, $options: 'i' } },
          ],
        },
      ];
      delete query.$or;
    }

    const [orders, total, allMerchantOrders] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
      Order.find(merchantFilter).lean(),
    ]);

    let totalRevenue = 0;
    let unitsSold = 0;
    let pendingFulfillment = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    for (const ord of allMerchantOrders) {
      for (const item of ord.orderItems) {
        const isItemMine =
          (item.companyId && item.companyId.toString() === companyId.toString()) ||
          (companyName && item.companyName?.toLowerCase() === companyName.toLowerCase());

        if (isItemMine) {
          unitsSold += item.quantity;
          if (ord.orderStatus !== 'cancelled') {
            totalRevenue += item.price * item.quantity;
          }
        }
      }

      if (['placed', 'confirmed', 'processing'].includes(ord.orderStatus)) {
        pendingFulfillment += 1;
      } else if (ord.orderStatus === 'delivered') {
        deliveredCount += 1;
      } else if (ord.orderStatus === 'cancelled') {
        cancelledCount += 1;
      }
    }

    return res.status(200).json({
      success: true,
      orders,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
      stats: {
        totalOrders: allMerchantOrders.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        unitsSold,
        pendingFulfillment,
        deliveredCount,
        cancelledCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      carrier,
      trackingNumber,
      estimatedDelivery,
      shippingNotes,
      note,
    } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'New order status is required',
      });
    }

    const validStatuses = [
      'placed',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.orderStatus = status;

    if (carrier) order.fulfillment.carrier = carrier;
    if (trackingNumber) order.fulfillment.trackingNumber = trackingNumber;
    if (shippingNotes) order.fulfillment.shippingNotes = shippingNotes;
    if (estimatedDelivery) order.fulfillment.estimatedDelivery = new Date(estimatedDelivery);

    if (status === 'shipped' && !order.fulfillment.shippedAt) {
      order.fulfillment.shippedAt = new Date();
    }
    if (status === 'delivered' && !order.fulfillment.deliveredAt) {
      order.fulfillment.deliveredAt = new Date();
    }

    const updaterName = req.user?.companyName || req.user?.name || 'Merchant Staff';
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status.toUpperCase()} by ${updaterName}`,
      updatedBy: updaterName,
    });

    const updatedOrder = await order.save();

    await invalidateOrderCaches(order.userId, order._id, req.user?.userId);

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderAnalytics = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const userCompany = req.user?.companyName;

    let query = {};
    if (userRole === 'company') {
      query = {
        $or: [
          { 'orderItems.companyId': new mongoose.Types.ObjectId(userId) },
          ...(userCompany ? [{ 'orderItems.companyName': userCompany }] : []),
        ],
      };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(200).lean();

    let totalRevenue = 0;
    let totalUnits = 0;
    const statusCounts = {};

    orders.forEach((ord) => {
      statusCounts[ord.orderStatus] = (statusCounts[ord.orderStatus] || 0) + 1;
      if (ord.orderStatus !== 'cancelled') {
        if (userRole === 'company') {
          ord.orderItems.forEach((item) => {
            if (
              (item.companyId && item.companyId.toString() === userId.toString()) ||
              (userCompany && item.companyName?.toLowerCase() === userCompany.toLowerCase())
            ) {
              totalRevenue += item.price * item.quantity;
              totalUnits += item.quantity;
            }
          });
        } else {
          totalRevenue += ord.pricing.totalPrice;
          totalUnits += ord.orderItems.reduce((s, i) => s + i.quantity, 0);
        }
      }
    });

    return res.status(200).json({
      success: true,
      analytics: {
        totalOrders: orders.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalUnits,
        averageOrderValue: orders.length > 0 ? Number((totalRevenue / orders.length).toFixed(2)) : 0,
        statusCounts,
        recentOrders: orders.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const trackOrder = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const { postalCode, email } = req.query;

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required for tracking',
      });
    }

    const query = { orderNumber: orderNumber.trim().toUpperCase() };
    if (postalCode) {
      query['shippingAddress.postalCode'] = postalCode.trim();
    }
    if (email) {
      query['customer.email'] = email.trim().toLowerCase();
    }

    const order = await Order.findOne(query)
      .select('orderNumber orderStatus statusHistory fulfillment shippingMethod pricing.totalPrice createdAt')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order #${orderNumber} could not be found with the provided details.`,
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};
