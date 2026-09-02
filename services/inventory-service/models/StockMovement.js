import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    movementType: {
      type: String,
      enum: [
        'INCOMING_RESTOCK',
        'RESERVATION_HOLD',
        'RESERVATION_RELEASE',
        'PURCHASE_COMMIT',
        'MANUAL_ADJUSTMENT',
        'RETURN_RESTOCK',
      ],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousAvailable: {
      type: Number,
      default: 0,
    },
    newAvailable: {
      type: Number,
      default: 0,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      sparse: true,
    },
    reservationId: {
      type: String,
      index: true,
      sparse: true,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    performedBy: {
      type: String,
      default: 'system',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

export default StockMovement;
