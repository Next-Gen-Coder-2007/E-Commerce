import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'stripe_mock', 'upi', 'mock_instant', 'paypal', 'wallet'],
      default: 'mock_instant',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true,
    },
    gatewayProvider: {
      type: String,
      default: 'Stripe_Mock',
    },
    gatewayTxnId: {
      type: String,
      default: '',
    },
    failureReason: {
      type: String,
      default: '',
    },
    refundDetails: {
      isRefunded: {
        type: Boolean,
        default: false,
      },
      amount: {
        type: Number,
        default: 0,
      },
      refundedAt: {
        type: Date,
      },
      reason: {
        type: String,
        default: '',
      },
      refundTxnId: {
        type: String,
        default: '',
      },
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

export default PaymentTransaction;
