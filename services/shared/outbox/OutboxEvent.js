import mongoose from 'mongoose';

const outboxEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    aggregateType: {
      type: String,
      required: true,
      index: true, // e.g., 'Order', 'PaymentTransaction', 'InventoryItem'
    },
    aggregateId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true, // e.g., 'ORDER_CREATED', 'PAYMENT_COMPLETED'
    },
    topic: {
      type: String,
      required: true,
    },
    partitionKey: {
      type: String,
      default: null,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    headers: {
      correlationId: String,
      traceId: String,
      sourceService: String,
      schemaVersion: { type: String, default: '1.0.0' },
    },
    status: {
      type: String,
      enum: ['UNPUBLISHED', 'PROCESSING', 'PUBLISHED', 'FAILED'],
      default: 'UNPUBLISHED',
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 5,
    },
    error: {
      type: String,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

outboxEventSchema.index({ status: 1, createdAt: 1 });

export const getOutboxModel = (connection = mongoose) => {
  if (connection.models && connection.models.OutboxEvent) {
    return connection.models.OutboxEvent;
  }
  return connection.model('OutboxEvent', outboxEventSchema);
};

export default mongoose.models.OutboxEvent || mongoose.model('OutboxEvent', outboxEventSchema);
