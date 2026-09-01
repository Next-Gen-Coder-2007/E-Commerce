import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';

// POST /api/coupons (Create Coupon - Merchant / Admin)
export const createCoupon = async (req, res, next) => {
  try {
    const { userId, role, companyName } = req.user;

    if (role !== 'company' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only registered merchants or admins can create promotional coupons.',
      });
    }

    const {
      code,
      description,
      discountType = 'percentage',
      discountValue,
      minPurchaseAmount = 0,
      maxDiscountAmount,
      applicableProducts = [],
      startDate,
      endDate,
      usageLimit,
      userUsageLimit = 1,
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon promo code is required (e.g. SUMMER20).',
      });
    }

    const cleanCode = code.trim().toUpperCase();

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an offer description (e.g. 20% off all orders over $40).',
      });
    }

    const numericValue = Number(discountValue);
    if (!numericValue || numericValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount value must be greater than 0.',
      });
    }

    if (discountType === 'percentage' && numericValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount cannot exceed 100%.',
      });
    }

    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please specify an expiration date for this coupon offer.',
      });
    }

    const expiryDate = new Date(endDate);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expiration date must be in the future.',
      });
    }

    // Check duplicate code
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code "${cleanCode}" is already in use. Please choose a unique code name.`,
      });
    }

    // Sanitize applicable products
    let sanitizedProducts = [];
    if (Array.isArray(applicableProducts) && applicableProducts.length > 0) {
      sanitizedProducts = applicableProducts.filter((id) => mongoose.Types.ObjectId.isValid(id));
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description: description.trim(),
      discountType,
      discountValue: numericValue,
      minPurchaseAmount: Number(minPurchaseAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      companyId: role === 'company' ? new mongoose.Types.ObjectId(userId) : null,
      companyName: role === 'company' ? companyName || 'Verified Merchant' : 'Nova Marketplace',
      applicableProducts: sanitizedProducts,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: expiryDate,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      userUsageLimit: Number(userUsageLimit) || 1,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `Coupon "${cleanCode}" created successfully!`,
      coupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A coupon with this code already exists.',
      });
    }
    next(error);
  }
};

// GET /api/coupons/company/mine (Merchant Coupons Feed & Metrics)
export const getMyCompanyCoupons = async (req, res, next) => {
  try {
    const { userId, role } = req.user;

    if (role !== 'company' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Merchant authorization required.',
      });
    }

    const coupons = await Coupon.find({ companyId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    const activeCoupons = coupons.filter((c) => c.isActive && new Date(c.endDate) > now).length;
    const totalRedemptions = coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0);
    const totalSavingsGranted = coupons.reduce((acc, c) => acc + (c.totalDiscountGiven || 0), 0);

    res.status(200).json({
      success: true,
      summary: {
        totalCoupons: coupons.length,
        activeCoupons,
        totalRedemptions,
        totalSavingsGranted: Math.round(totalSavingsGranted * 100) / 100,
      },
      coupons,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/coupons/available (Public / Shopper Available Offers)
export const getAvailableCoupons = async (req, res, next) => {
  try {
    const { companyId, productId } = req.query;
    const now = new Date();

    const query = {
      isActive: true,
      endDate: { $gt: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usageCount', '$usageLimit'] } },
      ],
    };

    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      query.$or = [
        { companyId: new mongoose.Types.ObjectId(companyId) },
        { companyId: null }, // Platform-wide coupons
      ];
    }

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      query.$or = [
        { applicableProducts: { $size: 0 } },
        { applicableProducts: new mongoose.Types.ObjectId(productId) },
      ];
    }

    const coupons = await Coupon.find(query)
      .select('code description discountType discountValue minPurchaseAmount maxDiscountAmount companyName endDate usageLimit usageCount')
      .sort({ discountValue: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/coupons/validate (Validate coupon against cart items and calculate exact savings)
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, cartItems = [], subtotal = 0, userId } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        isValid: false,
        message: 'Please enter a coupon code.',
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return res.status(404).json({
        isValid: false,
        message: `Promo code "${cleanCode}" was not found. Please check for spelling mistakes.`,
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        isValid: false,
        message: `Coupon code "${cleanCode}" is currently inactive or paused.`,
      });
    }

    const now = new Date();
    if (now < new Date(coupon.startDate)) {
      return res.status(400).json({
        isValid: false,
        message: `Coupon "${cleanCode}" is not active yet. Starts on ${new Date(coupon.startDate).toLocaleDateString()}.`,
      });
    }

    if (now > new Date(coupon.endDate)) {
      return res.status(400).json({
        isValid: false,
        message: `Coupon "${cleanCode}" has expired on ${new Date(coupon.endDate).toLocaleDateString()}.`,
      });
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({
        isValid: false,
        message: `Coupon "${cleanCode}" has reached its total maximum redemption limit.`,
      });
    }

    // Check per-user redemption limit if userId provided
    if (userId && coupon.usedBy && coupon.usedBy.length > 0) {
      const userRedemptions = coupon.usedBy.filter(
        (u) => u.userId?.toString() === userId.toString()
      ).length;
      if (userRedemptions >= coupon.userUsageLimit) {
        return res.status(400).json({
          isValid: false,
          message: `You have already redeemed coupon "${cleanCode}" the maximum number of times allowed (${coupon.userUsageLimit}x).`,
        });
      }
    }

    // Determine eligible items in cart
    let eligibleSubtotal = 0;
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      const applicableProdIds = (coupon.applicableProducts || []).map((id) => id.toString());

      cartItems.forEach((item) => {
        const itemPrice = Number(item.price) || 0;
        const itemQty = Number(item.quantity) || 1;
        const itemTotal = itemPrice * itemQty;

        let isItemEligible = true;

        // Check company match if merchant coupon
        if (coupon.companyId) {
          const itemCompanyId = item.companyId || item.product?.companyId;
          if (itemCompanyId && itemCompanyId.toString() !== coupon.companyId.toString()) {
            isItemEligible = false;
          }
        }

        // Check specific products match if applicableProducts defined
        if (applicableProdIds.length > 0) {
          const itemProdId = (item.productId || item._id || '').toString();
          if (!applicableProdIds.includes(itemProdId)) {
            isItemEligible = false;
          }
        }

        if (isItemEligible) {
          eligibleSubtotal += itemTotal;
        }
      });
    } else {
      eligibleSubtotal = Number(subtotal) || 0;
    }

    if (eligibleSubtotal === 0) {
      return res.status(400).json({
        isValid: false,
        message: `Coupon "${cleanCode}" is only applicable to products from ${coupon.companyName}. None of your current cart items qualify.`,
      });
    }

    if (coupon.minPurchaseAmount && eligibleSubtotal < coupon.minPurchaseAmount) {
      return res.status(400).json({
        isValid: false,
        message: `Coupon "${cleanCode}" requires a minimum qualifying purchase of $${coupon.minPurchaseAmount.toFixed(2)}. Your current qualifying total is $${eligibleSubtotal.toFixed(2)}.`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (eligibleSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, eligibleSubtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalTotal = Math.max(0, Number(subtotal) - discountAmount);

    res.status(200).json({
      isValid: true,
      code: coupon.code,
      couponId: coupon._id,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalTotal,
      companyName: coupon.companyName,
      message: `Coupon "${coupon.code}" applied! You save $${discountAmount.toFixed(2)}.`,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/coupons/redeem (Internal / Order-Service Record Redemption)
export const redeemCoupon = async (req, res, next) => {
  try {
    const { code, userId, orderId, discountAmount = 0 } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    coupon.usageCount = (coupon.usageCount || 0) + 1;
    coupon.totalDiscountGiven = (coupon.totalDiscountGiven || 0) + Number(discountAmount);

    if (userId) {
      coupon.usedBy.push({
        userId: new mongoose.Types.ObjectId(userId),
        orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
        discountAmount: Number(discountAmount),
        usedAt: new Date(),
      });
    }

    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Coupon ${cleanCode} redeemed successfully`,
      usageCount: coupon.usageCount,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/coupons/:id (Update Coupon - Merchant / Admin)
export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid coupon identifier' });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (coupon.companyId && coupon.companyId.toString() !== userId.toString() && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this coupon.' });
    }

    const {
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      endDate,
      usageLimit,
      userUsageLimit,
      isActive,
    } = req.body;

    if (description !== undefined) coupon.description = description.trim();
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minPurchaseAmount !== undefined) coupon.minPurchaseAmount = Number(minPurchaseAmount);
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    if (endDate !== undefined) coupon.endDate = new Date(endDate);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit ? Number(usageLimit) : null;
    if (userUsageLimit !== undefined) coupon.userUsageLimit = Number(userUsageLimit) || 1;
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);

    await coupon.save();

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/coupons/:id/toggle (Toggle Active/Paused Status - Merchant / Admin)
export const toggleCouponStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid coupon identifier' });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (coupon.companyId && coupon.companyId.toString() !== userId.toString() && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this coupon.' });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" is now ${coupon.isActive ? 'Active' : 'Paused'}.`,
      isActive: coupon.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/coupons/:id (Delete Coupon - Merchant / Admin)
export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid coupon identifier' });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (coupon.companyId && coupon.companyId.toString() !== userId.toString() && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this coupon.' });
    }

    await Coupon.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" removed successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
