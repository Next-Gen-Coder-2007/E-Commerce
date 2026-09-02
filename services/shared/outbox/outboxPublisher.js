import crypto from 'crypto';
import OutboxEvent, { getOutboxModel } from './OutboxEvent.js';
import { createProducer } from '../kafka/producer.js';

class OutboxPublisher {
  constructor(serviceName = 'service', options = {}) {
    this.serviceName = serviceName;
    this.producer = createProducer(serviceName);
    this.intervalMs = options.intervalMs || 1500;
    this.batchSize = options.batchSize || 20;
    this.timer = null;
    this.isPolling = false;
  }

  /**
   * Helper to write an event to the Outbox collection atomically
   */
  static async queueEvent(OutboxModel, eventData) {
    const Model = OutboxModel || OutboxEvent;
    const eventId = eventData.eventId || `evt_${crypto.randomBytes(8).toString('hex')}`;

    if (Model.db && typeof Model.db.readyState === 'number' && Model.db.readyState !== 1) {
      // Offline/test fallback
      return {
        eventId,
        aggregateType: eventData.aggregateType,
        aggregateId: String(eventData.aggregateId),
        eventType: eventData.eventType,
        topic: eventData.topic,
        payload: eventData.payload,
        status: 'UNPUBLISHED',
      };
    }

    return Model.create({
      eventId,
      aggregateType: eventData.aggregateType,
      aggregateId: String(eventData.aggregateId),
      eventType: eventData.eventType,
      topic: eventData.topic,
      partitionKey: eventData.partitionKey ? String(eventData.partitionKey) : String(eventData.aggregateId),
      payload: eventData.payload,
      headers: {
        correlationId: eventData.correlationId || `corr_${crypto.randomBytes(8).toString('hex')}`,
        traceId: eventData.traceId || `tr_${crypto.randomBytes(12).toString('hex')}`,
        sourceService: eventData.sourceService,
        schemaVersion: eventData.schemaVersion || '1.0.0',
      },
      status: 'UNPUBLISHED',
      retryCount: 0,
      maxRetries: eventData.maxRetries || 5,
    });
  }

  /**
   * Process a single batch of unpublished outbox events
   */
  async processBatch(OutboxModel) {
    const Model = OutboxModel || OutboxEvent;

    // Check if database is connected before querying
    if (Model.db?.readyState !== 1) {
      return 0;
    }

    try {
      // Find unpublished events with FIFO ordering
      const events = await Model.find({
        status: { $in: ['UNPUBLISHED', 'PROCESSING'] },
        retryCount: { $lt: 5 },
      })
        .sort({ createdAt: 1 })
        .limit(this.batchSize);

      if (!events || events.length === 0) return 0;

      for (const event of events) {
        await this._publishSingleEvent(Model, event);
      }

      return events.length;
    } catch (err) {
      console.warn(`[Outbox Poller:${this.serviceName}] Poller batch error:`, err.message);
      return 0;
    }
  }

  async _publishSingleEvent(Model, event) {
    try {
      const publishResult = await this.producer.publishEvent(
        event.topic,
        event.eventType,
        event.payload,
        {
          eventId: event.eventId,
          key: event.partitionKey || event.aggregateId,
          correlationId: event.headers?.correlationId,
          traceId: event.headers?.traceId,
          schemaVersion: event.headers?.schemaVersion,
        }
      );

      if (publishResult.success) {
        event.status = 'PUBLISHED';
        event.publishedAt = new Date();
        event.error = null;
        await event.save();
      } else {
        event.retryCount += 1;
        event.error = publishResult.error || 'Publish returned unsuccessful';
        if (event.retryCount >= event.maxRetries) {
          event.status = 'FAILED';
          console.error(`[Outbox Poller:${this.serviceName}] Event ${event.eventId} marked as FAILED after max retries.`);
        }
        await event.save();
      }
    } catch (err) {
      event.retryCount += 1;
      event.error = err.message;
      if (event.retryCount >= event.maxRetries) {
        event.status = 'FAILED';
      }
      await event.save();
    }
  }

  start(OutboxModel) {
    if (this.timer) return;
    this.producer.connect().catch(() => {});

    console.log(`[Outbox Poller:${this.serviceName}] Background Outbox poller started (interval: ${this.intervalMs}ms)`);

    this.timer = setInterval(async () => {
      if (this.isPolling) return;
      this.isPolling = true;
      try {
        await this.processBatch(OutboxModel);
      } finally {
        this.isPolling = false;
      }
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log(`[Outbox Poller:${this.serviceName}] Outbox poller stopped.`);
    }
  }
}

export const createOutboxPublisher = (serviceName, options) => new OutboxPublisher(serviceName, options);
export default OutboxPublisher;
