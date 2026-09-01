import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'general',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    companyName: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    addressLine1: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    addressLine2: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State / Province is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
    },
    country: {
      type: String,
      default: 'United States',
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required for shipping updates'],
      trim: true,
    },
    deliveryNotes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: String,
      default: 'system',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customer: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        default: '',
        trim: true,
      },
    },
    orderItems: {
      type: [orderItemSchema],
      validate: [
        (val) => Array.isArray(val) && val.length > 0,
        'An order must contain at least one product item',
      ],
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    shippingMethod: {
      type: String,
      enum: ['standard', 'express', 'priority', 'overnight'],
      default: 'standard',
    },
    paymentInfo: {
      method: {
        type: String,
        enum: ['card_upi', 'card', 'upi', 'cod', 'stripe', 'paypal', 'mock_instant'],
        default: 'card_upi',
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: {
        type: String,
        default: '',
      },
      paidAt: {
        type: Date,
      },
    },
    pricing: {
      itemsPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      shippingPrice: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      taxPrice: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      couponCode: {
        type: String,
        default: '',
        trim: true,
        uppercase: true,
      },
      totalPrice: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    orderStatus: {
      type: String,
      enum: [
        'placed',
        'confirmed',
        'processing',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded',
      ],
      default: 'placed',
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    fulfillment: {
      carrier: {
        type: String,
        default: 'NovaExpress',
      },
      trackingNumber: {
        type: String,
        default: '',
      },
      estimatedDelivery: {
        type: Date,
      },
      shippedAt: {
        type: Date,
      },
      deliveredAt: {
        type: Date,
      },
      shippingNotes: {
        type: String,
        default: '',
      },
    },
    cancellation: {
      isCancelled: {
        type: Boolean,
        default: false,
      },
      cancelledAt: {
        type: Date,
      },
      cancelReason: {
        type: String,
        default: '',
      },
      cancelledBy: {
        type: String,
        default: '',
      },
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ 'orderItems.companyId': 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
