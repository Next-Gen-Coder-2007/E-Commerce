import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide a coupon code'],
      uppercase: true,
      trim: true,
      unique: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [25, 'Coupon code cannot exceed 25 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a coupon description/details'],
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    discountType: {
      type: String,
      required: [true, 'Please select discount type (percentage or fixed)'],
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Please provide the discount value'],
      min: [0.01, 'Discount value must be greater than 0'],
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum purchase amount cannot be negative'],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: [0, 'Maximum discount cap cannot be negative'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: 'Nova Marketplace',
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, 'Please specify an expiration date'],
    },
    usageLimit: {
      type: Number,
      default: null,
      min: [1, 'Usage limit must be at least 1'],
    },
    userUsageLimit: {
      type: Number,
      default: 1,
      min: [1, 'Per-user limit must be at least 1'],
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDiscountGiven: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        discountAmount: {
          type: Number,
          required: true,
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ companyId: 1, isActive: 1, endDate: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
