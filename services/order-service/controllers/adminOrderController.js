import Order from '../models/Order.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';

/**
 * @desc Get global platform order metrics & financial overview
 * @route GET /api/orders/admin/metrics
 * @access Private (Admin)
 */
export const getAdminOrderMetrics = async (req, res, next) => {
  try {
    const [totalOrders, statusCounts, financialStats, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalGMV: { $sum: '$pricing.totalPrice' },
            avgOrderValue: { $avg: '$pricing.totalPrice' },
            totalDiscount: { $sum: '$pricing.discountAmount' },
          },
        },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber pricing orderStatus user createdAt orderItems')
        .lean(),
    ]);

    const statusMap = statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const finance = financialStats[0] || { totalGMV: 0, avgOrderValue: 0, totalDiscount: 0 };

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        totalOrders,
        totalGMV: Number(finance.totalGMV.toFixed(2)),
        avgOrderValue: Number(finance.avgOrderValue.toFixed(2)),
        totalDiscount: Number(finance.totalDiscount.toFixed(2)),
        statusBreakdown: {
          pending: statusMap['pending'] || statusMap['PENDING'] || 0,
          confirmed: statusMap['confirmed'] || statusMap['CONFIRMED'] || 0,
          processing: statusMap['processing'] || statusMap['PROCESSING'] || 0,
          shipped: statusMap['shipped'] || statusMap['SHIPPED'] || 0,
          delivered: statusMap['delivered'] || statusMap['DELIVERED'] || 0,
          cancelled: statusMap['cancelled'] || statusMap['CANCELLED'] || 0,
          refunded: statusMap['refunded'] || statusMap['REFUNDED'] || 0,
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all orders across the entire platform
 * @route GET /api/orders/admin/all
 * @access Private (Admin)
 */
export const getAdminAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { status, search, minPrice, maxPrice } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.orderStatus = new RegExp(`^${status}$`, 'i');
    }

    if (minPrice || maxPrice) {
      query['pricing.totalPrice'] = {};
      if (minPrice) query['pricing.totalPrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.totalPrice'].$lte = parseFloat(maxPrice);
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: regex },
        { 'shippingAddress.fullName': regex },
        { 'shippingAddress.phone': regex },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Admin manual status override (e.g. force cancellation, manual refund)
 * @route PATCH /api/orders/admin/:id/override
 * @access Private (Admin)
 */
export const overrideOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendError(res, {
        statusCode: 404,
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status.toLowerCase();

    if (order.statusTimeline) {
      order.statusTimeline.push({
        status: status.toLowerCase(),
        timestamp: new Date(),
        note: note || `Administrative status override by Admin (${req.user?.name || 'Admin'})`,
        actor: 'admin',
      });
    }

    if (status.toLowerCase() === 'refunded') {
      order.paymentInfo.status = 'refunded';
    }

    await order.save();

    return sendSuccess(res, {
      statusCode: 200,
      message: `Order status successfully updated from ${previousStatus} to ${order.orderStatus}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
